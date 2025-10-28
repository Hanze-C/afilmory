import { z } from 'zod'

export const SUPER_ADMIN_SETTING_DEFINITIONS = {
  allowRegistration: {
    key: 'system.registration.allow',
    schema: z.boolean(),
    defaultValue: true,
  },
  maxRegistrableUsers: {
    key: 'system.registration.maxUsers',
    schema: z.number().int().min(0).nullable(),
    defaultValue: null as number | null,
  },
  localProviderEnabled: {
    key: 'system.auth.localProvider.enabled',
    schema: z.boolean(),
    defaultValue: true,
  },
} as const

export type SuperAdminSettingField = keyof typeof SUPER_ADMIN_SETTING_DEFINITIONS
export type SuperAdminSettingKey = (typeof SUPER_ADMIN_SETTING_DEFINITIONS)[SuperAdminSettingField]['key']

export const SUPER_ADMIN_SETTING_KEYS = Object.values(SUPER_ADMIN_SETTING_DEFINITIONS).map(
  (definition) => definition.key,
)
