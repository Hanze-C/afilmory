export const ROUTE_PATHS = {
  LOGIN: '/login',
  WELCOME: '/welcome',
  TENANT_MISSING: '/tenant-missing',
  DEFAULT_AUTHENTICATED: '/',
  SUPERADMIN_ROOT: '/superadmin',
  SUPERADMIN_DEFAULT: '/superadmin/settings',
  NO_ACCESS: '/no-access',
} as const

export const PUBLIC_ROUTES = new Set<string>([
  ROUTE_PATHS.LOGIN,
  ROUTE_PATHS.WELCOME,
  ROUTE_PATHS.TENANT_MISSING,
  ROUTE_PATHS.NO_ACCESS,
])
