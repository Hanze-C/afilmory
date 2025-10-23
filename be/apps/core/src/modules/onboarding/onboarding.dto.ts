import { createZodDto } from '@afilmory/framework'
import { z } from 'zod'

import { SETTING_SCHEMAS, SettingKeys } from '../setting/setting.constant'

const adminSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

const keySchema = z.enum(SettingKeys)

const settingEntrySchema = z.object({
  key: keySchema,
  value: z.unknown(),
})

const normalizeEntries = z
  .union([settingEntrySchema, z.object({ entries: z.array(settingEntrySchema).min(1) })])
  .transform((payload) => {
    const entries = 'entries' in payload ? payload.entries : [payload]
    return entries.map((entry) => ({
      key: entry.key,
      value: SETTING_SCHEMAS[entry.key].parse(entry.value),
    }))
  })

export class OnboardingInitDto extends createZodDto(
  z.object({
    admin: adminSchema,
    settings: normalizeEntries.optional().transform((entries) => entries ?? []),
  }),
) {}

export type NormalizedSettingEntry = {
  key: z.infer<typeof keySchema>
  value: unknown
}
