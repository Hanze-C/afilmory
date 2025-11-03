import { createAuthClient } from 'better-auth/react'
import { FetchError } from 'ofetch'

const apiBase = import.meta.env.VITE_APP_API_BASE?.replace(/\/$/, '') || '/api'

const globalAuthBase = resolveUrl(`${apiBase}/auth`)
const tenantAuthBase = resolveUrl(`${apiBase}/tenant-auth`)

const commonOptions = {
  fetchOptions: {
    credentials: 'include' as const,
  },
}

export const globalAuthClient = createAuthClient({
  baseURL: globalAuthBase,
  ...commonOptions,
})

export const tenantAuthClient = createAuthClient({
  baseURL: tenantAuthBase,
  ...commonOptions,
})

const { useSession } = globalAuthClient
const { signIn: globalRawSignIn, signOut: globalRawSignOut } = globalAuthClient
const { signIn: tenantRawSignIn, signOut: tenantRawSignOut } = tenantAuthClient

export { useSession }

export const signInGlobal = globalRawSignIn
export const signInTenant = tenantRawSignIn

export const signOutGlobal = globalRawSignOut
export const signOutTenant = tenantRawSignOut

export async function signOutBySource(source?: 'global' | 'tenant') {
  const targets: Array<'global' | 'tenant'> = source ? [source] : ['tenant', 'global']
  let lastError: unknown = null
  const recoverableStatuses = new Set([401, 403, 404])

  for (const target of targets) {
    try {
      if (target === 'tenant') {
        await tenantAuthClient.signOut()
      } else {
        await globalAuthClient.signOut()
      }
    } catch (error) {
      if (error instanceof FetchError) {
        const status = error.statusCode ?? error.response?.status ?? null
        if (status && recoverableStatuses.has(status)) {
          continue
        }
      }
      lastError = error
    }
  }

  if (lastError) {
    throw lastError
  }
}

function resolveUrl(url: string): string {
  if (url.startsWith('/')) {
    const { origin } = window.location
    return `${origin}${url}`
  }
  return url
}
