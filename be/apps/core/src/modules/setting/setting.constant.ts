import { z } from 'zod'

import type { SettingDefinition, SettingMetadata } from './setting.type'

export const DEFAULT_SETTING_DEFINITIONS = {
  // 'ai.openai.apiKey': {
  //   isSensitive: true,
  //   schema: z.string().min(1, 'OpenAI API key cannot be empty'),
  // },
  // 'ai.openai.baseUrl': {
  //   isSensitive: false,
  //   schema: z.url('OpenAI Base URL cannot be empty'),
  // },
  // 'ai.embedding.model': {
  //   isSensitive: false,
  //   schema: z.string().min(1, 'AI Model name cannot be empty'),
  // },
  'auth.google.clientId': {
    isSensitive: false,
    schema: z.string().min(1, 'Google Client ID cannot be empty'),
  },
  'auth.google.clientSecret': {
    isSensitive: true,
    schema: z.string().min(1, 'Google Client secret cannot be empty'),
  },
  'auth.github.clientId': {
    isSensitive: false,
    schema: z.string().min(1, 'GitHub Client ID cannot be empty'),
  },
  'auth.github.clientSecret': {
    isSensitive: true,
    schema: z.string().min(1, 'GitHub Client secret cannot be empty'),
  },
  'builder.storage.providers': {
    isSensitive: false,
    schema: z.string().transform((value, ctx) => {
      const normalized = value.trim()
      if (normalized.length === 0) {
        return '[]'
      }

      try {
        const parsed = JSON.parse(normalized)
        if (!Array.isArray(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Builder storage providers must be a JSON array',
          })
          return z.NEVER
        }
        return JSON.stringify(parsed)
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Builder storage providers must be valid JSON',
        })
        return z.NEVER
      }
    }),
  },
  'builder.storage.activeProvider': {
    isSensitive: false,
    schema: z.string().transform((value) => value.trim()),
  },
  'http.cors.allowedOrigins': {
    isSensitive: false,
    schema: z
      .string()
      .min(1, 'CORS allowed origins cannot be empty')
      .transform((value) => value.trim()),
  },
} as const satisfies Record<string, SettingDefinition>

export const DEFAULT_SETTING_METADATA = Object.fromEntries(
  Object.entries(DEFAULT_SETTING_DEFINITIONS).map(([key, definition]) => [
    key,
    { isSensitive: definition.isSensitive } satisfies SettingMetadata,
  ]),
) as Record<keyof typeof DEFAULT_SETTING_DEFINITIONS, SettingMetadata>

const settingKeys = Object.keys(DEFAULT_SETTING_DEFINITIONS) as Array<keyof typeof DEFAULT_SETTING_DEFINITIONS>

export const SettingKeys = settingKeys as [
  keyof typeof DEFAULT_SETTING_DEFINITIONS,
  ...Array<keyof typeof DEFAULT_SETTING_DEFINITIONS>,
]

export const SETTING_SCHEMAS = Object.fromEntries(
  Object.entries(DEFAULT_SETTING_DEFINITIONS).map(([key, definition]) => [key, definition.schema]),
) as Record<
  keyof typeof DEFAULT_SETTING_DEFINITIONS,
  (typeof DEFAULT_SETTING_DEFINITIONS)[keyof typeof DEFAULT_SETTING_DEFINITIONS]['schema']
>

export const AES_ALGORITHM = 'aes-256-gcm'
export const IV_LENGTH = 12
export const AUTH_TAG_LENGTH = 16
