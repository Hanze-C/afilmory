import type { CanActivate, ExecutionContext } from '@afilmory/framework'
import { HttpContext } from '@afilmory/framework'
import type { Session } from 'better-auth'
import { BizException, ErrorCode } from 'core/errors'
import { injectable } from 'tsyringe'

import { AuthProvider, AuthSession } from '../modules/auth/auth.provider'
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
  constructor(private readonly authProvider: AuthProvider) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const store = context.getContext()
    const { hono } = store

    const auth = this.authProvider.getAuth()

    const session = await auth.api.getSession({ headers: hono.req.raw.headers })
    if (!session) {
      throw new BizException(ErrorCode.AUTH_UNAUTHORIZED)
    }

    HttpContext.assign({
      auth: {
        user: session.user,
        session: session.session,
      },
    })

    // Role verification if decorator is present
    const handler = context.getHandler()
    const requiredMask = getAllowedRoleMask(handler)
    if (requiredMask > 0) {
      const userRoleName = session.user.role as 'user' | 'admin' | undefined
      const userMask = userRoleName ? roleNameToBit(userRoleName) : 0
      const hasRole = (requiredMask & userMask) !== 0
      if (!hasRole) {
        throw new BizException(ErrorCode.AUTH_FORBIDDEN)
      }
    }
    return true
  }
}
