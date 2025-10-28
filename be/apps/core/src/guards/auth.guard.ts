import { authUsers } from '@afilmory/db'
import type { CanActivate, ExecutionContext } from '@afilmory/framework'
import { HttpContext } from '@afilmory/framework'
import type { Session } from 'better-auth'
import { applyTenantIsolationContext, DbAccessor } from 'core/database/database.provider'
import { BizException, ErrorCode } from 'core/errors'
import { getTenantContext } from 'core/modules/tenant/tenant.context'
import { TenantService } from 'core/modules/tenant/tenant.service'
import { eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import type { AuthSession } from '../modules/auth/auth.provider'
import { AuthProvider } from '../modules/auth/auth.provider'
import { getAllowedRoleMask, roleNameToBit } from './roles.decorator'

declare module '@afilmory/framework' {
  interface HttpContextValues {
    auth?: {
      user?: AuthSession['user']
      session?: Session
    }
  }
}

@injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly dbAccessor: DbAccessor,
    private readonly tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const store = context.getContext()
    const { hono } = store

    const auth = await this.authProvider.getAuth()

    const session = await auth.api.getSession({ headers: hono.req.raw.headers })

    let tenantContext = getTenantContext()
    if (!tenantContext) {
      tenantContext = await this.tenantService.resolve({ fallbackToDefault: true })
      HttpContext.assign({ tenant: tenantContext })
    }

    if (!tenantContext) {
      throw new BizException(ErrorCode.TENANT_NOT_FOUND)
    }

    if (session) {
      HttpContext.assign({
        auth: {
          user: session.user,
          session: session.session,
        },
      })

      const roleName = session.user.role as 'user' | 'admin' | 'superadmin' | undefined
      const isSuperAdmin = roleName === 'superadmin'
      let sessionTenantId = session.user?.tenantId

      if (!isSuperAdmin) {
        if (!sessionTenantId) {
          const db = this.dbAccessor.get()
          const [record] = await db
            .select({ tenantId: authUsers.tenantId })
            .from(authUsers)
            .where(eq(authUsers.id, session.user.id))
            .limit(1)

          sessionTenantId = record?.tenantId ?? ''
        }

        if (!sessionTenantId) {
          throw new BizException(ErrorCode.AUTH_FORBIDDEN)
        }

        if (sessionTenantId !== tenantContext.tenant.id) {
          throw new BizException(ErrorCode.AUTH_FORBIDDEN)
        }
      }

      await applyTenantIsolationContext({
        tenantId: tenantContext.tenant.id,
        isSuperAdmin,
      })

      if (isSuperAdmin) {
        return true
      }
    }
    // Role verification if decorator is present
    const handler = context.getHandler()
    const requiredMask = getAllowedRoleMask(handler)
    if (requiredMask > 0) {
      if (!session) {
        throw new BizException(ErrorCode.AUTH_UNAUTHORIZED)
      }

      const userRoleName = session.user.role as 'user' | 'admin' | 'superadmin' | undefined
      const userMask = userRoleName ? roleNameToBit(userRoleName) : 0
      const hasRole = (requiredMask & userMask) !== 0
      if (!hasRole) {
        throw new BizException(ErrorCode.AUTH_FORBIDDEN)
      }
    }
    return true
  }
}
