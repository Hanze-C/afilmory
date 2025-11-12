import { coreApi } from '~/lib/api-client'
import { camelCaseKeys } from '~/lib/case'

import type { BetterAuthSession, BetterAuthUser } from '../types'

export interface SessionTenant {
  id: string
  slug: string | null
  isPlaceholder: boolean
}

export type SessionResponse = {
  user: BetterAuthUser
  session: BetterAuthSession
  tenant: SessionTenant | null
}

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const

export async function fetchSession() {
  return camelCaseKeys<SessionResponse>(await coreApi<SessionResponse>('/auth/session', { method: 'GET' }))
}
