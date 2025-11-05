import { authUsers, tenantAuthUsers } from '@afilmory/db'
import type { CanActivate, ExecutionContext } from '@afilmory/framework'
import { HttpContext } from '@afilmory/framework'
import type { Session } from 'better-auth'
import { applyTenantIsolationContext, DbAccessor } from 'core/database/database.provider'
import { BizException, ErrorCode } from 'core/errors'
import { getTenantContext } from 'core/modules/tenant/tenant.context'
import { TenantContextResolver } from 'core/modules/tenant/tenant-context-resolver.service'
import { eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import type { AuthSession } from '../modules/auth/auth.provider'
import { AuthProvider } from '../modules/auth/auth.provider'
import type { TenantAuthSession } from '../modules/tenant-auth/tenant-auth.provider'
import { TenantAuthProvider } from '../modules/tenant-auth/tenant-auth.provider'
import { getAllowedRoleMask, roleNameToBit } from './roles.decorator'

declare module '@afilmory/framework' {
  interface HttpContextValues {
    auth?: {
      user?: AuthSession['user'] | TenantAuthSession['user']
      session?: Session
      source?: 'global' | 'tenant'
    }
  }
}

@injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly tenantAuthProvider: TenantAuthProvider,
    private readonly dbAccessor: DbAccessor,
    private readonly tenantContextResolver: TenantContextResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const store = context.getContext()
    const { hono } = store

    let tenantContext = getTenantContext()

    if (!tenantContext) {
      const resolvedTenant = await this.tenantContextResolver.resolve(hono, {
        setResponseHeaders: false,
      })
      HttpContext.setValue('tenant', tenantContext)
      tenantContext = resolvedTenant ?? undefined
    }

    const { headers } = hono.req.raw

    const globalAuth = this.authProvider.getAuth()
    let sessionSource: 'global' | 'tenant' | null = null
    let authSession: AuthSession | TenantAuthSession | null = await globalAuth.api.getSession({ headers })

    if (authSession) {
      sessionSource = 'global'
    } else if (tenantContext) {
      const tenantAuth = await this.tenantAuthProvider.getAuth(tenantContext.tenant.id)
      authSession = await tenantAuth.api.getSession({ headers })
      if (authSession) {
        sessionSource = 'tenant'
      }
    }

    if (authSession) {
      HttpContext.assign({
        auth: {
          user: authSession.user,
          session: authSession.session,
          source: sessionSource ?? undefined,
        },
      })
      const userRoleValue = (authSession.user as { role?: string }).role
      const roleName = userRoleValue as 'user' | 'admin' | 'superadmin' | 'guest' | undefined
      const isGlobalSession = sessionSource === 'global'
      const isSuperAdmin = isGlobalSession && roleName === 'superadmin'
      let sessionTenantId = (authSession.user as { tenantId?: string | null }).tenantId ?? null

      if (!isSuperAdmin) {
        if (!sessionTenantId) {
          const db = this.dbAccessor.get()
          if (sessionSource === 'tenant') {
            const [record] = await db
              .select({ tenantId: tenantAuthUsers.tenantId })
              .from(tenantAuthUsers)
              .where(eq(tenantAuthUsers.id, authSession.user.id))
              .limit(1)
            sessionTenantId = record?.tenantId ?? ''
          } else {
            const [record] = await db
              .select({ tenantId: authUsers.tenantId })
              .from(authUsers)
              .where(eq(authUsers.id, authSession.user.id))
              .limit(1)
            sessionTenantId = record?.tenantId ?? ''
          }
        }

        if (!sessionTenantId) {
          throw new BizException(ErrorCode.AUTH_FORBIDDEN)
        }

        if (!tenantContext) {
          throw new BizException(ErrorCode.AUTH_FORBIDDEN)
        }
        if (sessionTenantId !== tenantContext.tenant.id) {
          throw new BizException(ErrorCode.AUTH_FORBIDDEN)
        }
      }

      if (tenantContext) {
        await applyTenantIsolationContext({
          tenantId: tenantContext.tenant.id,
          isSuperAdmin,
        })
      }

      if (isSuperAdmin) {
        return true
      }
    }
    // Role verification if decorator is present
    const handler = context.getHandler()
    const requiredMask = getAllowedRoleMask(handler)
    if (requiredMask > 0) {
      if (!authSession) {
        throw new BizException(ErrorCode.AUTH_UNAUTHORIZED)
      }

      const userRoleName = (authSession.user as { role?: string }).role as
        | 'user'
        | 'admin'
        | 'superadmin'
        | 'guest'
        | undefined
      const userMask = userRoleName ? roleNameToBit(userRoleName) : 0
      const hasRole = (requiredMask & userMask) !== 0
      if (!hasRole) {
        throw new BizException(ErrorCode.AUTH_FORBIDDEN)
      }
    }
    return true
  }
}
