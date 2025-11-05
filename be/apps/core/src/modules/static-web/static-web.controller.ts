import { ContextParam, Controller, Get, Head } from '@afilmory/framework'
import type { Context } from 'hono'

import { SkipTenant } from '../../decorators/skip-tenant.decorator'
import type { StaticAssetService } from './static-asset.service'
import { STATIC_DASHBOARD_BASENAME, StaticDashboardService } from './static-dashboard.service'
import { StaticWebService } from './static-web.service'

@SkipTenant()
@Controller({ bypassGlobalPrefix: true })
export class StaticWebController {
  constructor(
    private readonly staticWebService: StaticWebService,
    private readonly staticDashboardService: StaticDashboardService,
  ) {}

  @Get('/*')
  async getAsset(@ContextParam() context: Context) {
    const pathname = context.req.path
    const service = this.resolveService(pathname)
    const normalizedPath = this.normalizeRequestPath(pathname, service)
    const response = await service.handleRequest(normalizedPath, false)
    return response ?? new Response('Not Found', { status: 404 })
  }

  @Head('/*')
  async headAsset(@ContextParam() context: Context) {
    const pathname = context.req.path
    const service = this.resolveService(pathname)
    const normalizedPath = this.normalizeRequestPath(pathname, service)
    const response = await service.handleRequest(normalizedPath, true)
    return response ?? new Response(null, { status: 404 })
  }

  private resolveService(pathname: string): StaticAssetService {
    if (this.isDashboardPath(pathname)) {
      return this.staticDashboardService
    }

    return this.staticWebService
  }

  private normalizeRequestPath(pathname: string, service: StaticAssetService): string {
    if (service !== this.staticDashboardService) {
      return pathname
    }

    if (this.isDashboardBasename(pathname)) {
      return pathname
    }

    if (this.isLegacyDashboardPath(pathname)) {
      return pathname.replace(/^\/static\/dashboard/, STATIC_DASHBOARD_BASENAME)
    }

    return pathname
  }

  private isDashboardPath(pathname: string): boolean {
    return this.isDashboardBasename(pathname) || this.isLegacyDashboardPath(pathname)
  }

  private isDashboardBasename(pathname: string): boolean {
    return pathname === STATIC_DASHBOARD_BASENAME || pathname.startsWith(`${STATIC_DASHBOARD_BASENAME}/`)
  }

  private isLegacyDashboardPath(pathname: string): boolean {
    return pathname === '/static/dashboard' || pathname.startsWith('/static/dashboard/')
  }
}
