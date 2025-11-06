import { injectable } from 'tsyringe'

import { SuperAdminSettingService } from '../system-setting/super-admin-setting.service'

export interface SocialProviderOptions {
  clientId: string
  clientSecret: string
  redirectPath?: string | null
}

export interface SocialProvidersConfig {
  google?: SocialProviderOptions
  github?: SocialProviderOptions
}

export interface AuthModuleOptions {
  prefix: string
  useDrizzle: boolean
  socialProviders: SocialProvidersConfig
  baseDomain: string
}

@injectable()
export class AuthConfig {
  constructor(private readonly superAdminSettings: SuperAdminSettingService) {}

  async getOptions(): Promise<AuthModuleOptions> {
    const prefix = '/auth'
    const { socialProviders, baseDomain } = await this.superAdminSettings.getAuthModuleConfig()

    return {
      prefix,
      useDrizzle: true,
      socialProviders,
      baseDomain,
    }
  }
}
