export const getCurrentHostname = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.location.hostname
  } catch {
    return null
  }
}

export const buildRegistrationUrl = (): string => {
  if (typeof window === 'undefined') {
    return '/platform/welcome'
  }

  try {
    const { protocol, host } = window.location
    return `${protocol}//${host}/platform/welcome`
  } catch {
    return '/platform/welcome'
  }
}

export const buildHomeUrl = (): string => {
  if (typeof window === 'undefined') {
    return '/'
  }

  try {
    const { protocol, hostname, port } = window.location
    const normalizedPort = port ? `:${port}` : ''
    return `${protocol}//${hostname}${normalizedPort}`
  } catch {
    return '/'
  }
}
