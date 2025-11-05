import type { HttpMiddleware } from '@afilmory/framework'
import { HttpContext, Middleware } from '@afilmory/framework'
import { DEFAULT_BASE_DOMAIN, isTenantSlugReserved } from '@afilmory/utils'
import { BizException, ErrorCode } from 'core/errors'
import type { Context, Next } from 'hono'
import { injectable } from 'tsyringe'

import { logger } from '../helpers/logger.helper'
import { OnboardingService } from '../modules/onboarding/onboarding.service'
import { SuperAdminSettingService } from '../modules/system-setting/super-admin-setting.service'
import { TenantService } from '../modules/tenant/tenant.service'

const HEADER_TENANT_ID = 'x-tenant-id'
const HEADER_TENANT_SLUG = 'x-tenant-slug'

@Middleware()
@injectable()
export class TenantResolverMiddleware implements HttpMiddleware {
  private readonly log = logger.extend('TenantResolver')

  constructor(
    private readonly tenantService: TenantService,
    private readonly onboardingService: OnboardingService,
    private readonly superAdminSettingService: SuperAdminSettingService,
  ) {}

   
  async use(context: Context, next: Next): Promise<Response | void> {
    const { path } = context.req

    // During onboarding (before any user/tenant exists), skip tenant resolution entirely
    const initialized = await this.onboardingService.isInitialized()
    if (!initialized) {
      this.log.info(`Application not initialized yet, skip tenant resolution for ${path}`)
      return await next()
    }

    const tenantContext = await this.resolveTenantContext(context)

    if (tenantContext) {
      HttpContext.assign({ tenant: tenantContext })
    }

    const response = await next()

    if (tenantContext) {
      context.header(HEADER_TENANT_ID, tenantContext.tenant.id)
      context.header(HEADER_TENANT_SLUG, tenantContext.tenant.slug)
    }

    return response
  }

  private async resolveTenantContext(context: Context) {
    const forwardedHost = context.req.header('x-forwarded-host')
    const origin = context.req.header('origin')
    const hostHeader = context.req.header('host')
    const host = this.normalizeHost(forwardedHost ?? hostHeader ?? null, origin)

    const tenantId = this.normalizeString(context.req.header(HEADER_TENANT_ID))
    const tenantSlugHeader = this.normalizeSlug(context.req.header(HEADER_TENANT_SLUG))

    this.log.verbose(
      `Resolve tenant for request ${context.req.method} ${context.req.path} (host=${host ?? 'n/a'}, id=${tenantId ?? 'n/a'}, slug=${tenantSlugHeader ?? 'n/a'})`,
    )

    const baseDomain = await this.getBaseDomain()

    let derivedSlug = tenantSlugHeader

    if (!derivedSlug && host) {
      derivedSlug = this.extractSlugFromHost(host, baseDomain)
    }

    if (derivedSlug && isTenantSlugReserved(derivedSlug)) {
      this.log.verbose(`Host ${host} matched reserved slug ${derivedSlug}, skipping tenant resolution.`)
      return null
    }

    const tenantContext = await this.tenantService.resolve(
      {
        tenantId,
        slug: derivedSlug,
      },
      true,
    )

    if (!tenantContext) {
      if (tenantId || derivedSlug || host) {
        throw new BizException(ErrorCode.TENANT_NOT_FOUND)
      }
      return null
    }

    return tenantContext
  }

  private async getBaseDomain(): Promise<string> {
    if (process.env.NODE_ENV === 'development') {
      return 'localhost'
    }
    const settings = await this.superAdminSettingService.getSettings()
    return settings.baseDomain || DEFAULT_BASE_DOMAIN
  }

  private normalizeHost(host: string | null | undefined, origin: string | null | undefined): string | null {
    const source = host ?? this.extractHostFromOrigin(origin)
    if (!source) {
      return null
    }

    return source.trim().toLowerCase()
  }

  private extractHostFromOrigin(origin: string | null | undefined): string | null {
    if (!origin) {
      return null
    }

    try {
      const url = new URL(origin)
      return url.host
    } catch {
      return null
    }
  }

  private normalizeString(value: string | null | undefined): string | undefined {
    if (!value) {
      return undefined
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  private normalizeSlug(value: string | null | undefined): string | undefined {
    const normalized = this.normalizeString(value)
    return normalized ? normalized.toLowerCase() : undefined
  }

  private extractSlugFromHost(host: string, baseDomain: string): string | undefined {
    const hostname = host.split(':')[0]

    if (!hostname) {
      return undefined
    }

    if (hostname.endsWith('.localhost')) {
      const parts = hostname.split('.localhost')[0]
      return parts ? parts.trim().toLowerCase() : undefined
    }

    const normalizedBase = baseDomain.toLowerCase()
    if (hostname === normalizedBase) {
      return undefined
    }

    if (hostname.endsWith(`.${normalizedBase}`)) {
      const candidate = hostname.slice(0, hostname.length - normalizedBase.length - 1)
      if (!candidate || candidate.includes('.')) {
        return undefined
      }
      return candidate.toLowerCase()
    }

    return undefined
  }
}
