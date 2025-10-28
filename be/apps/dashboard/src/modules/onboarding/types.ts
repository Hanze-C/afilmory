import type { OnboardingSettingKey } from './constants'

export type TenantFormState = {
  name: string
  slug: string
  domain: string
}

export type AdminFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type SettingFormState = Record<
  OnboardingSettingKey,
  {
    enabled: boolean
    value: string
  }
>

export type OnboardingErrors = Record<string, string>
