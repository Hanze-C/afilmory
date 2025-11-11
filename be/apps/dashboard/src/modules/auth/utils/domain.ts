const SECOND_LEVEL_PUBLIC_SUFFIXES = new Set(['ac', 'co', 'com', 'edu', 'gov', 'net', 'org'])

export function resolveBaseDomain(hostname: string): string {
  const envValue = (import.meta.env as Record<string, unknown> | undefined)?.VITE_APP_TENANT_BASE_DOMAIN
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    return envValue.trim().replace(/^\./, '').toLowerCase()
  }

  if (!hostname) {
    return ''
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return 'localhost'
  }

  const parts = hostname.split('.').filter(Boolean)
  if (parts.length <= 2) {
    return hostname
  }

  const tld = parts.at(-1) ?? ''
  const secondLevel = parts.at(-2) ?? ''

  if (tld.length === 2 && SECOND_LEVEL_PUBLIC_SUFFIXES.has(secondLevel) && parts.length >= 3) {
    return parts.slice(-3).join('.').toLowerCase()
  }

  return parts.slice(-2).join('.').toLowerCase()
}

export function getTenantSlugFromHost(hostname: string): string | null {
  if (!hostname) {
    return null
  }

  const baseDomain = resolveBaseDomain(hostname)
  if (!baseDomain) {
    return null
  }

  if (baseDomain === 'localhost') {
    if (!hostname.endsWith('.localhost') || hostname === 'localhost') {
      return null
    }
    const candidate = hostname.slice(0, -'.localhost'.length)
    return candidate || null
  }

  if (hostname === baseDomain) {
    return null
  }

  if (hostname.endsWith(`.${baseDomain}`)) {
    const candidate = hostname.slice(0, -(baseDomain.length + 1))
    return candidate.includes('.') ? null : candidate || null
  }

  return null
}

export function buildTenantUrl(slug: string, path = '/'): string {
  const normalizedSlug = slug?.trim().toLowerCase() ?? ''
  if (!normalizedSlug) {
    throw new Error('Workspace slug is required to build tenant URL.')
  }

  if (typeof window === 'undefined') {
    throw new TypeError('Cannot build tenant URL outside the browser environment.')
  }

  const { protocol, hostname, port } = window.location
  const baseDomain = resolveBaseDomain(hostname)

  if (!baseDomain) {
    throw new Error('Unable to resolve base domain for tenant URL.')
  }

  const shouldAppendPort = Boolean(
    port && (baseDomain === 'localhost' || hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)),
  )

  const portSegment = shouldAppendPort ? `:${port}` : ''
  const scheme = protocol || 'https:'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${scheme}//${normalizedSlug}.${baseDomain}${portSegment}${normalizedPath}`
}
