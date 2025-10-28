import { createAuthClient } from 'better-auth/react'

const apiBase = `${import.meta.env.VITE_APP_API_BASE?.replace(/\/$/, '') || '/api'}/auth`

const resolvedApiBase = resolveUrl(apiBase)
export const authClient = createAuthClient({
  baseURL: resolvedApiBase,
  fetchOptions: {
    credentials: 'include',
  },
})

export const { signIn, signOut, useSession } = authClient

function resolveUrl(url: string): string {
  if (url.startsWith('/')) {
    const { origin } = window.location
    return `${origin}${url}`
  }
  return url
}
