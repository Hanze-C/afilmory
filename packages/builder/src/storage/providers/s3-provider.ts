import path from 'node:path'

import { XMLParser } from 'fast-xml-parser'

import { backoffDelay, sleep } from '../../../../utils/src/backoff.js'
import { Semaphore } from '../../../../utils/src/semaphore.js'
import { SUPPORTED_FORMATS } from '../../constants/index.js'
import { logger } from '../../logger/index.js'
import type { SimpleS3Client } from '../../s3/client.js'
import { createS3Client, encodeS3Key } from '../../s3/client.js'
import type { ProgressCallback, S3Config, StorageObject, StorageProvider, StorageUploadOptions } from '../interfaces'

// 将 AWS S3 对象转换为通用存储对象
const xmlParser = new XMLParser({ ignoreAttributes: false })

const MAX_ERROR_SNIPPET_LENGTH = 300

const pickStringField = (source: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

function formatS3ErrorBody(body?: string | null): string {
  if (!body) {
    return '响应为空'
  }

  const trimmed = body.trim()
  if (!trimmed) {
    return '响应为空'
  }

  const pickCodeAndMessage = (payload: Record<string, unknown>): string | null => {
    if (!payload || typeof payload !== 'object') return null

    const code = pickStringField(payload, ['Code', 'code', 'ErrorCode'])
    const message = pickStringField(payload, ['Message', 'message', 'ErrorMessage'])
    const requestId = pickStringField(payload, ['RequestId', 'requestId'])
    const hostId = pickStringField(payload, ['HostId', 'hostId'])

    if (code || message) {
      const parts: string[] = []
      if (code) parts.push(`[${code}]`)
      if (message) parts.push(message)

      const extraDetails: string[] = []
      if (requestId) extraDetails.push(`RequestId=${requestId}`)
      if (hostId) extraDetails.push(`HostId=${hostId}`)
      if (extraDetails.length > 0) {
        parts.push(`(${extraDetails.join(', ')})`)
      }

      return parts.join(' ')
    }

    return null
  }

  const tryJson = () => {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        const direct = pickCodeAndMessage(parsed as Record<string, unknown>)
        if (direct) return direct
        if ('error' in parsed && typeof parsed.error === 'object' && parsed.error) {
          const nested = pickCodeAndMessage(parsed.error as Record<string, unknown>)
          if (nested) return nested
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    return null
  }

  const tryXml = () => {
    try {
      const parsed = xmlParser.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        const errorNode =
          (parsed.Error as Record<string, unknown> | undefined) ??
          (parsed.ErrorResponse as Record<string, unknown> | undefined) ??
          (parsed as Record<string, unknown>)

        const formatted = pickCodeAndMessage(errorNode)
        if (formatted) return formatted
      }
    } catch {
      // ignore XML parse errors
    }
    return null
  }

  const formatted = tryJson() ?? tryXml()
  if (formatted) {
    return formatted
  }

  if (trimmed.length > MAX_ERROR_SNIPPET_LENGTH) {
    return `${trimmed.slice(0, MAX_ERROR_SNIPPET_LENGTH)}…`
  }

  return trimmed
}

export class S3StorageProvider implements StorageProvider {
  private config: S3Config
  private client: SimpleS3Client
  private limiter: Semaphore

  constructor(config: S3Config) {
    this.config = config
    this.client = createS3Client(config)
    this.limiter = new Semaphore(this.config.downloadConcurrency ?? 16)
  }

  private buildObjectUrl(key?: string): string {
    return this.client.buildObjectUrl(key)
  }

  private async readStreamWithIdleTimeout(
    response: Response,
    controller: AbortController,
    idleTimeoutMs: number,
  ): Promise<{ buffer: Buffer; firstByteAt: number | null }> {
    if (!response.body) {
      return { buffer: Buffer.alloc(0), firstByteAt: null }
    }

    const reader = response.body.getReader()
    const chunks: Buffer[] = []
    let idleTimer: NodeJS.Timeout | null = null
    let firstByteAt: number | null = null

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        controller.abort()
      }, idleTimeoutMs)
    }

    resetIdle()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      if (value) {
        if (!firstByteAt) {
          firstByteAt = Date.now()
        }
        chunks.push(Buffer.from(value))
      }
      resetIdle()
    }

    if (idleTimer) {
      clearTimeout(idleTimer)
    }

    return {
      buffer: Buffer.concat(chunks),
      firstByteAt,
    }
  }

  async getFile(key: string): Promise<Buffer | null> {
    return await this.limiter.run(async () => {
      const maxAttempts = this.config.maxAttempts ?? 3
      const totalTimeoutMs = this.config.totalTimeoutMs ?? 60_000
      const idleTimeoutMs = this.config.idleTimeoutMs ?? 10_000

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const startTime = Date.now()
        const controller = new AbortController()
        const totalTimer = setTimeout(() => controller.abort(), totalTimeoutMs)

        try {
          logger.s3.info(`下载开始：${key} (attempt ${attempt}/${maxAttempts})`)

          const response = await this.client.fetch(this.buildObjectUrl(key), {
            method: 'GET',
            signal: controller.signal,
          })

          if (!response.ok || !response.body) {
            const bodyText = await response.text().catch(() => '')
            logger.s3.error(`S3 响应异常：${key} (status ${response.status}) ${formatS3ErrorBody(bodyText)}`)
            logger.s3.error(bodyText)
            return null
          }

          const { buffer, firstByteAt } = await this.readStreamWithIdleTimeout(response, controller, idleTimeoutMs)
          clearTimeout(totalTimer)

          const duration = Date.now() - startTime
          const ttfb = firstByteAt ? firstByteAt - startTime : duration
          const sizeKB = Math.round(buffer.length / 1024)
          logger.s3.success(`下载完成：${key} (${sizeKB}KB, ${duration}ms, TTFB ${ttfb}ms, attempt ${attempt})`)
          return buffer
        } catch (error) {
          const elapsed = Date.now() - startTime
          logger.s3.warn(`下载失败：${key} (attempt ${attempt}/${maxAttempts}, ${elapsed}ms)`, error)
          clearTimeout(totalTimer)

          if (attempt < maxAttempts) {
            const delay = backoffDelay(attempt)
            logger.s3.info(`等待 ${delay}ms 后重试：${key}`)
            await sleep(delay)
            continue
          }
          logger.s3.error(`下载最终失败：${key}`)
          return null
        }
      }

      return null
    })
  }

  async listImages(): Promise<StorageObject[]> {
    const objects = await this.listObjects()
    const excludeRegex = this.config.excludeRegex ? new RegExp(this.config.excludeRegex) : null

    // 过滤出图片文件并转换为通用格式
    const imageObjects = objects.filter((obj) => {
      if (!obj.key) return false
      if (excludeRegex && excludeRegex.test(obj.key)) return false

      const ext = path.extname(obj.key).toLowerCase()
      return SUPPORTED_FORMATS.has(ext)
    })

    return imageObjects
  }

  async listAllFiles(_progressCallback?: ProgressCallback): Promise<StorageObject[]> {
    return await this.listObjects()
  }

  generatePublicUrl(key: string): string {
    // 如果设置了自定义域名，直接使用自定义域名
    if (this.config.customDomain) {
      const customDomain = this.config.customDomain.replace(/\/$/, '') // 移除末尾的斜杠
      return `${customDomain}/${key}`
    }

    // 如果使用自定义端点，构建相应的 URL
    const { endpoint } = this.config

    const region = this.config.region ?? 'us-east-1'

    if (!endpoint) {
      // 默认 AWS S3 端点
      return `https://${this.config.bucket}.s3.${region}.amazonaws.com/${key}`
    }

    // 检查是否是标准 AWS S3 端点
    if (endpoint.includes('amazonaws.com')) {
      return `https://${this.config.bucket}.s3.${region}.amazonaws.com/${key}`
    }

    const baseUrl = endpoint.replace(/\/$/, '') // 移除末尾的斜杠

    if (endpoint.includes('aliyuncs.com')) {
      const protocolEndIndex = baseUrl.indexOf('//')
      if (protocolEndIndex === -1) {
        throw new Error('Invalid base URL format')
      }
      // 将 bucket 插入到 'https://` 之后，region 之前
      const prefix = baseUrl.slice(0, protocolEndIndex + 2) // 包括 'https://'
      const suffix = baseUrl.slice(protocolEndIndex + 2) // 剩余部分
      return `${prefix}${this.config.bucket}.${suffix}/${key}`
    }
    // 对于自定义端点（如 MinIO 等）
    return `${baseUrl}/${this.config.bucket}/${key}`
  }

  detectLivePhotos(allObjects: StorageObject[]): Map<string, StorageObject> {
    const livePhotoMap = new Map<string, StorageObject>() // image key -> video object

    // 按目录和基础文件名分组所有文件
    const fileGroups = new Map<string, StorageObject[]>()

    for (const obj of allObjects) {
      if (!obj.key) continue

      const dir = path.dirname(obj.key)
      const basename = path.parse(obj.key).name
      const groupKey = `${dir}/${basename}`

      if (!fileGroups.has(groupKey)) {
        fileGroups.set(groupKey, [])
      }
      fileGroups.get(groupKey)!.push(obj)
    }

    // 在每个分组中寻找图片 + 视频配对
    for (const files of fileGroups.values()) {
      let imageFile: StorageObject | null = null
      let videoFile: StorageObject | null = null

      for (const file of files) {
        if (!file.key) continue

        const ext = path.extname(file.key).toLowerCase()

        // 检查是否为支持的图片格式
        if (SUPPORTED_FORMATS.has(ext)) {
          imageFile = file
        }
        // 检查是否为 .mov 视频文件
        else if (ext === '.mov') {
          videoFile = file
        }
      }

      // 如果找到配对，记录为 live photo
      if (imageFile && videoFile && imageFile.key) {
        livePhotoMap.set(imageFile.key, videoFile)
      }
    }

    return livePhotoMap
  }

  private async listObjects(): Promise<StorageObject[]> {
    const url = new URL(this.buildObjectUrl())
    url.search = ''
    url.searchParams.set('list-type', '2')
    if (this.config.prefix) {
      url.searchParams.set('prefix', encodeS3Key(this.config.prefix))
    }
    if (this.config.maxFileLimit) {
      url.searchParams.set('max-keys', String(this.config.maxFileLimit))
    }

    const response = await this.client.fetch(url.toString(), { method: 'GET' })
    const text = await response.text()
    if (!response.ok) {
      throw new Error(`列出 S3 对象失败 (status ${response.status}): ${formatS3ErrorBody(text)}`)
    }
    const parsed = xmlParser.parse(text)
    const contents = parsed?.ListBucketResult?.Contents ?? []
    const items = Array.isArray(contents) ? contents : contents ? [contents] : []

    return items
      .map((item) => {
        const key = item?.Key ?? ''
        return {
          key,
          size: item?.Size !== undefined ? Number(item.Size) : undefined,
          lastModified: item?.LastModified ? new Date(item.LastModified) : undefined,
          etag: typeof item?.ETag === 'string' ? item.ETag.replaceAll('"', '') : undefined,
        } satisfies StorageObject
      })
      .filter((item) => Boolean(item.key))
  }

  async deleteFile(key: string): Promise<void> {
    const response = await this.client.fetch(this.buildObjectUrl(key), {
      method: 'DELETE',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`删除 S3 对象失败：${key} (status ${response.status}) ${formatS3ErrorBody(text)}`)
    }
  }

  async uploadFile(key: string, data: Buffer, options?: StorageUploadOptions): Promise<StorageObject> {
    const response = await this.client.fetch(this.buildObjectUrl(key), {
      method: 'PUT',
      body: data as unknown as BodyInit,
      headers: {
        'content-type': options?.contentType ?? 'application/octet-stream',
        'content-length': data.byteLength.toString(),
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`上传 S3 对象失败：${key} (status ${response.status}) ${formatS3ErrorBody(text)}`)
    }

    const lastModified = new Date()

    return {
      key,
      size: data.byteLength,
      lastModified,
      etag: response.headers.get('etag') ?? undefined,
    }
  }
}
