import type { CanActivate, ExecutionContext } from '@afilmory/framework'
import { HttpContext } from '@afilmory/framework'
import type { HttpContextAuth } from 'core/context/http-context.values'
import { BizException, ErrorCode } from 'core/errors'
import { logger } from 'core/helpers/logger.helper'
import { injectable } from 'tsyringe'

import { getAllowedRoleMask, roleBitWithInheritance, roleNameToBit } from './roles.decorator'

@injectable()
export class RolesGuard implements CanActivate {
  private readonly log = logger.extend('RolesGuard')

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler()
    const targetClass = context.getClass()
    const store = context.getContext()
    const method = store?.hono?.req?.method ?? 'UNKNOWN'
    const path = store?.hono?.req?.path ?? 'UNKNOWN'
    const requiredMask = this.resolveRequiredMask(handler, targetClass)
    if (requiredMask === 0) {
      return true
    }

    const authContext = HttpContext.getValue('auth') as HttpContextAuth | undefined
    if (!authContext?.user || !authContext.session) {
      this.log.warn(`Denied access: missing session for role-protected resource ${method} ${path}`)
      throw new BizException(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const userRoleName = (authContext.user as { role?: string }).role as
      | 'user'
      | 'admin'
      | 'superadmin'
      | 'guest'
      | undefined
    const userMask = roleBitWithInheritance(roleNameToBit(userRoleName))
    const hasRole = (requiredMask & userMask) !== 0
    if (!hasRole) {
      this.log.warn(
        `Denied access: user ${(authContext.user as { id?: string }).id ?? 'unknown'} role=${userRoleName ?? 'n/a'} lacks permission mask=${requiredMask} on ${method} ${path}`,
      )
      throw new BizException(ErrorCode.AUTH_FORBIDDEN)
    }

    return true
  }

  private resolveRequiredMask(handler: ReturnType<ExecutionContext['getHandler']>, targetClass: object): number {
    const handlerMask = getAllowedRoleMask(handler)
    if (handlerMask !== 0) {
      return handlerMask
    }
    return getAllowedRoleMask(targetClass)
  }
}
