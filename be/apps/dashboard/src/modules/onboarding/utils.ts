import type { OnboardingSettingKey, SettingFieldDefinition } from './constants'
import { ONBOARDING_SETTING_SECTIONS, ONBOARDING_STEPS } from './constants'
import type { SettingFormState } from './types'

export const createInitialSettingsState = (): SettingFormState => {
  const state = {} as SettingFormState
  for (const section of ONBOARDING_SETTING_SECTIONS) {
    for (const field of section.fields) {
      state[field.key] = { enabled: false, value: '' }
    }
  }
  return state
}

export const maskSecret = (value: string) =>
  value ? '•'.repeat(Math.min(10, value.length)) : ''

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9-]+/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replaceAll(/^-+|-+$/g, '')

export const isLikelyEmail = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed.includes('@')) {
    return false
  }
  const [local, domain] = trimmed.split('@')
  if (!local || !domain || domain.startsWith('.') || domain.endsWith('.')) {
    return false
  }
  return domain.includes('.')
}

export const stepProgress = (index: number) =>
  Math.round((index / (ONBOARDING_STEPS.length - 1 || 1)) * 100)

export const getFieldByKey = (
  key: OnboardingSettingKey,
): SettingFieldDefinition => {
  for (const section of ONBOARDING_SETTING_SECTIONS) {
    for (const field of section.fields) {
      if (field.key === key) {
        return field
      }
    }
  }
  throw new Error(`Unknown onboarding setting key: ${key}`)
}
