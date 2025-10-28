import { atom } from 'jotai'

import { createAtomHooks } from '~/lib/jotai'
import type { BetterAuthUser } from '~/modules/auth/types'

const baseAuthUserAtom = atom<BetterAuthUser | null>(null)

export const [
  authUserAtom,
  useAuthUser,
  useAuthUserValue,
  useSetAuthUser,
  getAuthUser,
  setAuthUser,
] = createAtomHooks(baseAuthUserAtom)

// Selectors
export const useIsAuthenticated = () => {
  const user = useAuthUserValue()
  return !!user
}

export const useUserRole = () => {
  const user = useAuthUserValue()
  return user?.role ?? null
}

export const useIsAdmin = () => {
  const user = useAuthUserValue()
  return user?.role === 'admin' || user?.role === 'superadmin'
}

export const useIsSuperAdmin = () => {
  const user = useAuthUserValue()
  return user?.role === 'superadmin'
}
