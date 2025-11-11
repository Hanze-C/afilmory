import { FetchError } from 'ofetch'
import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { useSetAccessDenied } from '~/atoms/access-denied'
import { PUBLIC_ROUTES, ROUTE_PATHS } from '~/constants/routes'
import { checkDashboardAccess, checkSuperAdminAccess } from '~/modules/auth/api/permissions'
import type { SessionResponse } from '~/modules/auth/api/session'

type PermissionScope = 'admin' | 'superadmin'

const permissionCheckers: Record<PermissionScope, () => Promise<unknown>> = {
  admin: checkDashboardAccess,
  superadmin: checkSuperAdminAccess,
}

function getPermissionScope(pathname: string): PermissionScope | null {
  if (!pathname) {
    return null
  }
  if (PUBLIC_ROUTES.has(pathname)) {
    return null
  }
  if (pathname.startsWith(ROUTE_PATHS.SUPERADMIN_ROOT)) {
    return 'superadmin'
  }
  return 'admin'
}

type UseRoutePermissionArgs = {
  session: SessionResponse | null
  isLoading: boolean
}

export function useRoutePermission({ session, isLoading }: UseRoutePermissionArgs) {
  const location = useLocation()
  const setAccessDenied = useSetAccessDenied()

  useEffect(() => {
    if (isLoading) {
      return
    }
    if (!session) {
      return
    }

    const pathname = location.pathname || '/'
    if (pathname === ROUTE_PATHS.NO_ACCESS) {
      return
    }

    const scope = getPermissionScope(pathname)
    if (!scope) {
      setAccessDenied((prev) => (prev?.source === 'api' ? prev : null))
      return
    }

    let active = true

    permissionCheckers[scope]()
      .then(() => {
        if (!active) {
          return
        }
        setAccessDenied((prev) => {
          if (prev?.source === 'api') {
            return prev
          }
          return null
        })
      })
      .catch((error) => {
        if (!active) {
          return
        }
        if (error instanceof FetchError && error.statusCode === 403) {
          const reason =
            (error.data as { message?: string } | undefined)?.message ??
            error.response?._data?.message ??
            '您没有权限访问该页面'
          setAccessDenied({
            active: true,
            status: 403,
            path: pathname,
            scope,
            reason,
            source: 'route',
            timestamp: Date.now(),
          })
          return
        }
        console.error('Failed to verify route permission', error)
      })

    return () => {
      active = false
    }
  }, [isLoading, location.pathname, session, setAccessDenied])
}
