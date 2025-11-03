import { FetchError } from 'ofetch'

import { coreApi } from '~/lib/api-client'

import type { BetterAuthSession, BetterAuthUser } from '../types'

export type SessionResponse = {
  user: BetterAuthUser
  session: BetterAuthSession
  source?: 'global' | 'tenant'
}

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const

export async function fetchSession() {
  const fallbackStatus = new Set([401, 403, 404])

  try {
    const tenantSession = await coreApi<SessionResponse>('/tenant-auth/session', { method: 'GET' })
    return { ...tenantSession, source: tenantSession.source ?? 'tenant' }
  } catch (error) {
    if (!(error instanceof FetchError)) {
      throw error
    }

    const status = error.statusCode ?? error.response?.status ?? null
    if (!status || !fallbackStatus.has(status)) {
      throw error
    }
  }

  const globalSession = await coreApi<SessionResponse>('/auth/session', { method: 'GET' })
  return { ...globalSession, source: globalSession.source ?? 'global' }
}
