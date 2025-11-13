import crypto from 'node:crypto'

import type { S3Config } from '../storage/interfaces'

export interface SimpleS3Client {
  fetch: (input: string | URL, init?: RequestInit) => Promise<Response>
  buildObjectUrl: (key?: string) => string
  readonly bucket: string
  readonly region: string
}

export function createS3Client(config: S3Config): SimpleS3Client {
  if (config.provider !== 's3') {
    throw new Error('Storage provider is not s3')
  }

  const { accessKeyId, secretAccessKey, endpoint, bucket } = config
  const region = config.region ?? 'us-east-1'

  if (!bucket || bucket.trim().length === 0) {
    throw new Error('S3 bucket is required')
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('accessKeyId and secretAccessKey are required')
  }

  const baseUrl = buildBaseUrl({ bucket, region, endpoint })

  const signer = new SigV4Signer({
    accessKeyId,
    secretAccessKey,
    sessionToken: config.sessionToken,
    region,
    service: 's3',
  })

  return {
    bucket,
    region,
    fetch: async (input, init = {}) => {
      const fetchFn = globalThis.fetch?.bind(globalThis)
      if (!fetchFn) {
        throw new Error('Global fetch API is not available in this runtime.')
      }
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const signed = await signer.sign(url, init)
      return await fetchFn(signed.url, signed.init)
    },
    buildObjectUrl: (key = '') => {
      if (!key) {
        return baseUrl
      }
      return `${baseUrl}${encodeS3Key(key)}`
    },
  }
}

function buildBaseUrl(params: { bucket: string; region: string; endpoint?: string }): string {
  const { bucket, region, endpoint } = params
  if (!endpoint) {
    return `https://${bucket}.s3.${region}.amazonaws.com/`
  }

  const trimmed = endpoint.replace(/\/$/, '')
  if (trimmed.includes('{bucket}')) {
    return `${trimmed.replace('{bucket}', bucket)}/`
  }

  if (trimmed.includes(bucket)) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  }

  return `${trimmed}/${bucket}/`
}

export function encodeS3Key(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

const EMPTY_HASH = crypto.createHash('sha256').update('').digest('hex')

class SigV4Signer {
  constructor(
    private readonly options: {
      accessKeyId: string
      secretAccessKey: string
      sessionToken?: string
      region: string
      service: string
    },
  ) {}

  async sign(url: URL, init: RequestInit): Promise<{ url: string; init: RequestInit }> {
    const method = (init.method ?? 'GET').toUpperCase()
    const headers = new Headers(init.headers ?? {})
    headers.delete('authorization')

    headers.set('host', url.host)

    const body = init.body ?? null
    const payloadHash = await this.hashPayload(body)
    headers.set('x-amz-content-sha256', payloadHash)

    const now = new Date()
    const amzDate = toAmzDate(now)
    const dateStamp = amzDate.slice(0, 8)

    headers.set('x-amz-date', amzDate)
    if (this.options.sessionToken) {
      headers.set('x-amz-security-token', this.options.sessionToken)
    }

    const canonicalRequest = this.buildCanonicalRequest(method, url, headers, payloadHash)
    const credentialScope = `${dateStamp}/${this.options.region}/${this.options.service}/aws4_request`
    const stringToSign = this.buildStringToSign(amzDate, credentialScope, canonicalRequest)
    const signingKey = this.deriveSigningKey(dateStamp)
    const signature = hmac(signingKey, stringToSign).toString('hex')

    const signedHeaders = this.getSignedHeaders(headers)
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    headers.set('authorization', authorization)

    const nextInit: RequestInit = {
      ...init,
      headers,
      body,
    }

    return { url: url.toString(), init: nextInit }
  }

  private getSignedHeaders(headers: Headers): string {
    const entries = Array.from(headers.entries()).map(([name]) => name.toLowerCase())
    const unique = Array.from(new Set(entries))
    unique.sort()
    return unique.join(';')
  }

  private buildCanonicalRequest(method: string, url: URL, headers: Headers, payloadHash: string): string {
    const canonicalUri = encodeURI(url.pathname).replaceAll('%2F', '/')
    const canonicalQuery = buildCanonicalQuery(url.searchParams)
    const canonicalHeaders = buildCanonicalHeaders(headers)
    const signedHeaders = this.getSignedHeaders(headers)

    return `${method}\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
  }

  private buildStringToSign(amzDate: string, credentialScope: string, canonicalRequest: string): string {
    const hashedRequest = hashHex(canonicalRequest)
    return `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashedRequest}`
  }

  private deriveSigningKey(dateStamp: string): Buffer {
    const kDate = hmac(`AWS4${this.options.secretAccessKey}`, dateStamp)
    const kRegion = hmac(kDate, this.options.region)
    const kService = hmac(kRegion, this.options.service)
    return hmac(kService, 'aws4_request')
  }

  private async hashPayload(body: BodyInit | null): Promise<string> {
    if (!body) {
      return EMPTY_HASH
    }

    if (typeof body === 'string') {
      return hashHex(body)
    }

    if (body instanceof ArrayBuffer) {
      return hashHex(Buffer.from(body))
    }

    if (ArrayBuffer.isView(body)) {
      const view = body as ArrayBufferView
      return hashHex(Buffer.from(view.buffer, view.byteOffset, view.byteLength))
    }

    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
      return hashHex(body)
    }

    if (typeof Blob !== 'undefined' && body instanceof Blob) {
      const buf = Buffer.from(await body.arrayBuffer())
      return hashHex(buf)
    }

    throw new Error('Unsupported body type for SigV4 signer')
  }
}

function buildCanonicalQuery(params: URLSearchParams): string {
  const entries: Array<{ key: string; value: string }> = []
  params.forEach((value, key) => {
    entries.push({ key: encodeURIComponent(key), value: encodeURIComponent(value) })
  })
  entries.sort((a, b) => (a.key === b.key ? a.value.localeCompare(b.value) : a.key.localeCompare(b.key)))
  return entries.map(({ key, value }) => `${key}=${value}`).join('&')
}

function buildCanonicalHeaders(headers: Headers): string {
  const pairs = Array.from(headers.entries()).map(([name, value]) => [
    name.toLowerCase(),
    value.trim().replaceAll(/\s+/g, ' '),
  ])
  pairs.sort((a, b) => a[0].localeCompare(b[0]))
  return pairs.map(([name, value]) => `${name}:${value}\n`).join('')
}

function toAmzDate(date: Date): string {
  const yyyy = date.getUTCFullYear()
  const MM = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}${MM}${dd}T${hh}${mm}${ss}Z`
}

function hashHex(value: crypto.BinaryLike): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function hmac(key: crypto.BinaryLike, value: crypto.BinaryLike): Buffer {
  return crypto.createHmac('sha256', key).update(value).digest()
}
