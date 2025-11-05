import { DEFAULT_BASE_DOMAIN } from '@afilmory/utils'
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
  baseDomain: {
    key: 'system.domain.base',
    schema: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9.-]+$/i, {
        message: '域名只能包含字母、数字、连字符和点',
      }),
    defaultValue: DEFAULT_BASE_DOMAIN,
  },
} as const

export type SuperAdminSettingField = keyof typeof SUPER_ADMIN_SETTING_DEFINITIONS
export type SuperAdminSettingKey = (typeof SUPER_ADMIN_SETTING_DEFINITIONS)[SuperAdminSettingField]['key']

export const SUPER_ADMIN_SETTING_KEYS = Object.values(SUPER_ADMIN_SETTING_DEFINITIONS).map(
  (definition) => definition.key,
)
