import { createZodDto } from '@afilmory/framework'
import { z } from 'zod'

const updateSuperAdminSettingsSchema = z
  .object({
    allowRegistration: z.boolean().optional(),
    maxRegistrableUsers: z.number().int().min(0).nullable().optional(),
    localProviderEnabled: z.boolean().optional(),
    baseDomain: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9.-]+$/i, { message: '无效的基础域名' })
      .optional(),
    oauthGatewayUrl: z
      .string()
      .trim()
      .url({ message: '必须是有效的 URL' })
      .nullable()
      .refine((value) => value === null || value.startsWith('http://') || value.startsWith('https://'), {
        message: '仅支持 http 或 https 协议',
      })
      .optional(),
    oauthGoogleClientId: z.string().trim().min(1).nullable().optional(),
    oauthGoogleClientSecret: z.string().trim().min(1).nullable().optional(),
    oauthGithubClientId: z.string().trim().min(1).nullable().optional(),
    oauthGithubClientSecret: z.string().trim().min(1).nullable().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: '至少需要更新一项设置',
  })

export class UpdateSuperAdminSettingsDto extends createZodDto(updateSuperAdminSettingsSchema) {}
