import { injectable } from 'tsyringe'
import { z } from 'zod'

import type { SocialProvidersConfig } from '../auth/auth.config'
import { SettingService } from '../setting/setting.service'

export const TENANT_AUTH_CONFIG_SETTING_KEY = 'auth.tenant.config'

export interface TenantAuthOptions {
  localProviderEnabled: boolean
  socialProviders: SocialProvidersConfig
}

const providerConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().min(1).optional(),
})

const tenantAuthConfigSchema = z
  .object({
    localProviderEnabled: z.boolean().default(true),
    socialProviders: z
      .object({
        google: providerConfigSchema.optional(),
        github: providerConfigSchema.optional(),
        zoom: providerConfigSchema.optional(),
      })
      .partial()
      .default({}),
  })
  .default({ localProviderEnabled: true, socialProviders: {} })

type TenantAuthConfig = z.infer<typeof tenantAuthConfigSchema>

function normalizeConfig(raw: TenantAuthConfig): TenantAuthOptions {
  const socialProviders: SocialProvidersConfig = {}

  if (raw.socialProviders?.google) {
    socialProviders.google = raw.socialProviders.google
  }

  if (raw.socialProviders?.github) {
    socialProviders.github = raw.socialProviders.github
  }

  if (raw.socialProviders?.zoom) {
    socialProviders.zoom = raw.socialProviders.zoom
  }

  return {
    localProviderEnabled: raw.localProviderEnabled ?? true,
    socialProviders,
  }
}

@injectable()
export class TenantAuthConfigService {
  constructor(private readonly settingService: SettingService) {}

  async getOptions(tenantId: string): Promise<TenantAuthOptions> {
    const rawValue = await this.settingService.get(TENANT_AUTH_CONFIG_SETTING_KEY, { tenantId })

    if (!rawValue) {
      return normalizeConfig({ localProviderEnabled: true, socialProviders: {} })
    }

    try {
      const parsed = tenantAuthConfigSchema.parse(JSON.parse(rawValue))
      return normalizeConfig(parsed)
    } catch {
      // Fall back to defaults if parsing fails; tenant admins can fix configuration later.
      return normalizeConfig({ localProviderEnabled: true, socialProviders: {} })
    }
  }
}
