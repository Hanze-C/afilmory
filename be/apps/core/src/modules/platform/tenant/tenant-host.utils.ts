export function extractTenantSlugFromHost(host: string | null | undefined, baseDomain: string): string | null {
  if (!host) {
    return null
  }

  const hostname = host.split(':', 1)[0]
  if (!hostname) {
    return null
  }

  const normalizedHostname = hostname.trim().toLowerCase()
  if (!normalizedHostname) {
    return null
  }

  if (normalizedHostname.endsWith('.localhost')) {
    const candidate = normalizedHostname.slice(0, normalizedHostname.length - '.localhost'.length)
    return candidate ?? null
  }

  const normalizedBase = baseDomain.trim().toLowerCase()
  if (!normalizedBase || normalizedHostname === normalizedBase) {
    return null
  }

  if (normalizedHostname.endsWith(`.${normalizedBase}`)) {
    const candidate = normalizedHostname.slice(0, normalizedHostname.length - normalizedBase.length - 1)
    if (!candidate || candidate.includes('.')) {
      return null
    }
    return candidate
  }

  return null
}
