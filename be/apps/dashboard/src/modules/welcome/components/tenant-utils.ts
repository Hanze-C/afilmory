export const getCurrentHostname = (): string | null => {
  try {
    return window.location.hostname
  } catch {
    return null
  }
}

export const buildRegistrationUrl = (): string => {
  try {
    const { protocol, host } = window.location
    return `${protocol}//${host}/platform/welcome`
  } catch {
    return '/platform/welcome'
  }
}

export const buildHomeUrl = (): string => {
  try {
    const { protocol, hostname, port } = window.location
    const normalizedPort = port ? `:${port}` : ''
    return `${protocol}//${hostname}${normalizedPort}`
  } catch {
    return '/'
  }
}
