import type { HttpMiddleware } from '@afilmory/framework'
import { HttpContext, Middleware } from '@afilmory/framework'
import type { Context, Next } from 'hono'
import { injectable } from 'tsyringe'

import { logger } from '../helpers/logger.helper'
import { TenantService } from '../modules/tenant/tenant.service'

const HEADER_TENANT_ID = 'x-tenant-id'
const HEADER_TENANT_SLUG = 'x-tenant-slug'

@Middleware({ path: '/*', priority: -200 })
@injectable()
export class TenantResolverMiddleware implements HttpMiddleware {
  private readonly log = logger.extend('TenantResolver')

  constructor(private readonly tenantService: TenantService) {}

  async use(context: Context, next: Next): Promise<Response | void> {
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
      'Resolve tenant for request %s %s (host=%s, id=%s, slug=%s)',
      context.req.method,
      context.req.path,
      host ?? 'n/a',
      tenantId ?? 'n/a',
      tenantSlug ?? 'n/a',
    )

    return await this.tenantService.resolve({
      tenantId,
      slug: tenantSlug,
      domain: host,
      fallbackToDefault: true,
    })
  }
}
