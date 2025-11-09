import type { Session } from 'better-auth'

import type { AuthSession } from '../modules/auth/auth.provider'
import type { TenantContext } from '../modules/tenant/tenant.types'

export interface HttpContextAuth {
  user?: AuthSession['user']
  session?: Session
}
declare module '@afilmory/framework' {
  interface HttpContextValues {
    tenant?: TenantContext
    auth?: HttpContextAuth
  }
}
