import type { UiSchema } from '../ui-schema/ui-schema.type'
import type { SuperAdminSettingField } from './super-admin-setting.constants'

export interface SuperAdminSettings {
  allowRegistration: boolean
  maxRegistrableUsers: number | null
  localProviderEnabled: boolean
}

export type SuperAdminSettingValueMap = {
  [K in SuperAdminSettingField]: SuperAdminSettings[K]
}

export interface SuperAdminSettingsStats {
  totalUsers: number
  registrationsRemaining: number | null
}

export interface SuperAdminSettingsOverview {
  schema: UiSchema<SuperAdminSettingField>
  values: SuperAdminSettingValueMap
  stats: SuperAdminSettingsStats
}

export type UpdateSuperAdminSettingsInput = Partial<SuperAdminSettings>
