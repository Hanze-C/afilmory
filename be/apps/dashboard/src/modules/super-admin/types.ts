import type { UiSchema } from '../schema-form/types'

export interface SuperAdminSettings {
  allowRegistration: boolean
  localProviderEnabled: boolean
  maxRegistrableUsers: number | null
}

export type SuperAdminSettingField = keyof SuperAdminSettings

export interface SuperAdminStats {
  totalUsers: number
  registrationsRemaining: number | null
}

type SuperAdminSettingsResponseShape = {
  schema: UiSchema<SuperAdminSettingField>
  stats: SuperAdminStats
}

export type SuperAdminSettingsResponse =
  | (SuperAdminSettingsResponseShape & {
      values: SuperAdminSettings
      settings?: never
    })
  | (SuperAdminSettingsResponseShape & {
      settings: SuperAdminSettings
      values?: never
    })

export type UpdateSuperAdminSettingsPayload = Partial<{
  allowRegistration: boolean
  localProviderEnabled: boolean
  maxRegistrableUsers: number | null
}>
