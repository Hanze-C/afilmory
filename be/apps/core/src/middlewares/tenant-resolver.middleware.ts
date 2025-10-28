import type { HttpMiddleware } from '@afilmory/framework'
import { HttpContext, Middleware } from '@afilmory/framework'
import type { Context, Next } from 'hono'
import { injectable } from 'tsyringe'

import { logger } from '../helpers/logger.helper'
import { OnboardingService } from '../modules/onboarding/onboarding.service'
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
    HttpContext.assign({ tenant: tenantContext })

    const response = await next()

    context.header(HEADER_TENANT_ID, tenantContext.tenant.id)
    context.header(HEADER_TENANT_SLUG, tenantContext.tenant.slug)

    return response
  }

  private async resolveTenantContext(context: Context) {
    const host = context.req.header('host')
    const tenantId = context.req.header(HEADER_TENANT_ID)
    const tenantSlug = context.req.header(HEADER_TENANT_SLUG)

    this.log.debug(
      `Resolve tenant for request ${context.req.method} ${context.req.path} (host=${host ?? 'n/a'}, id=${tenantId ?? 'n/a'}, slug=${tenantSlug ?? 'n/a'})`,
    )

    return await this.tenantService.resolve({
      tenantId,
      slug: tenantSlug,
      domain: host,
      fallbackToDefault: true,
    })
  }
}
