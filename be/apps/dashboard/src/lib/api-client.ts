import { $fetch } from 'ofetch'

import { getAccessDenied, setAccessDenied } from '~/atoms/access-denied'

export const coreApiBaseURL = import.meta.env.VITE_APP_API_BASE?.replace(/\/$/, '') || '/api'

export const coreApi = $fetch.create({
  baseURL: coreApiBaseURL,
  credentials: 'include',
  onResponseError({ response }) {
    if (response?.status !== 403) {
      return
    }

    const current = getAccessDenied()
    const detail = (response._data as { message?: string } | undefined)?.message ?? current?.reason ?? null
    setAccessDenied({
      active: true,
      status: 403,
      path: typeof window !== 'undefined' ? window.location.pathname : current?.path,
      scope: current?.scope ?? 'api',
      reason: detail,
      source: 'api',
      timestamp: Date.now(),
    })
  },
})
