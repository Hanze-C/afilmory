import type { UiSchema } from 'core/modules/ui/ui-schema/ui-schema.type'

import type { SystemSettingField } from './system-setting.constants'

export interface SystemSettings {
  allowRegistration: boolean
  maxRegistrableUsers: number | null
  localProviderEnabled: boolean
  baseDomain: string
  oauthGatewayUrl: string | null
  oauthGoogleClientId: string | null
  oauthGoogleClientSecret: string | null
  oauthGithubClientId: string | null
  oauthGithubClientSecret: string | null
}

export type SystemSettingValueMap = {
  [K in SystemSettingField]: SystemSettings[K]
}

export interface SystemSettingStats {
  totalUsers: number
  registrationsRemaining: number | null
}

export interface SystemSettingOverview {
  schema: UiSchema<SystemSettingField>
  values: SystemSettingValueMap
  stats: SystemSettingStats
}

export type UpdateSystemSettingsInput = Partial<SystemSettings>

export { type SystemSettingField } from './system-setting.constants'
