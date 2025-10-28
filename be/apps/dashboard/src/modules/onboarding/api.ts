import { coreApi } from '~/lib/api-client'

import type { OnboardingSettingKey } from './constants'

export type OnboardingStatusResponse = {
  initialized: boolean
}

export type OnboardingInitPayload = {
  admin: {
    email: string
    password: string
    name: string
  }
  tenant: {
    name: string
    slug: string
    domain?: string
  }
  settings?: Array<{
    key: OnboardingSettingKey
    value: unknown
  }>
}

export type OnboardingInitResponse = {
  ok: boolean
  adminUserId: string
  tenantId: string
  superAdminUserId: string
}

export const getOnboardingStatus = async () =>
  await coreApi<OnboardingStatusResponse>('/onboarding/status', {
    method: 'GET',
  })

export const postOnboardingInit = async (payload: OnboardingInitPayload) =>
  await coreApi<OnboardingInitResponse>('/onboarding/init', {
    method: 'POST',
    body: payload,
  })
