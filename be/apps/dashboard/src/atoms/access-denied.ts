import { atom } from 'jotai'

import { createAtomHooks } from '~/lib/jotai'

export type AccessDeniedState = {
  active: boolean
  status?: number
  path?: string
  scope?: 'admin' | 'superadmin' | string
  reason?: string | null
  source?: 'route' | 'api'
  timestamp: number
} | null

const baseAccessDeniedAtom = atom<AccessDeniedState>(null)

export const [
  accessDeniedAtom,
  useAccessDenied,
  useAccessDeniedValue,
  useSetAccessDenied,
  getAccessDenied,
  setAccessDenied,
] = createAtomHooks(baseAccessDeniedAtom)
