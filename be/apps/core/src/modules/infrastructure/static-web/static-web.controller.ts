import { ContextParam, Controller, Get, Param } from '@afilmory/framework'
import { SkipTenantGuard } from 'core/decorators/skip-tenant.decorator'
import { getTenantContext, isPlaceholderTenantContext } from 'core/modules/platform/tenant/tenant.context'
import type { Context } from 'hono'

import type { StaticAssetService } from './static-asset.service'
import { STATIC_DASHBOARD_BASENAME, StaticDashboardService } from './static-dashboard.service'
import { StaticWebService } from './static-web.service'

const TENANT_MISSING_ENTRY_PATH = `${STATIC_DASHBOARD_BASENAME}/tenant-missing.html`

@Controller({ bypassGlobalPrefix: true })
export class StaticWebController {
  constructor(
    private readonly staticWebService: StaticWebService,
    private readonly staticDashboardService: StaticDashboardService,
  ) {}

  @Get('/static/web')
  @Get('/static/dashboard')
  @SkipTenantGuard()
  async getStaticWebRoot(@ContextParam() context: Context) {
    return await this.serve(context, this.staticWebService, false)
  }

  @Get(`/`)
  @Get(`/explory`)
  @SkipTenantGuard()
  async getStaticWebIndex(@ContextParam() context: Context) {
    if (this.shouldRenderTenantMissingPage()) {
      return await this.renderTenantMissingPage()
    }

    const response = await this.serve(context, this.staticWebService, false)
    if (response.status === 404) {
      return await this.renderTenantMissingPage()
    }
    return response
  }

  @Get(`/photos/:photoId`)
  async getStaticPhotoPage(@ContextParam() context: Context, @Param('photoId') photoId: string) {
    if (this.shouldRenderTenantMissingPage()) {
      return await this.renderTenantMissingPage()
    }
    const response = await this.serve(context, this.staticWebService, false)
    if (response.status === 404) {
      return await this.renderTenantMissingPage()
    }
    return await this.staticWebService.decoratePhotoPageResponse(context, photoId, response)
  }

  @SkipTenantGuard()
  @Get(`${STATIC_DASHBOARD_BASENAME}`)
  @Get(`${STATIC_DASHBOARD_BASENAME}/*`)
  async getStaticDashboardIndexWithBasename(@ContextParam() context: Context) {
    const isHtmlRoute = this.isHtmlRoute(context.req.path)
    if (isHtmlRoute && this.shouldRenderTenantMissingPage()) {
      return await this.renderTenantMissingPage()
    }
    const response = await this.serve(context, this.staticDashboardService, false)
    if (isHtmlRoute && response.status === 404) {
      return await this.renderTenantMissingPage()
    }
    return response
  }

  @SkipTenantGuard()
  @Get('/*')
  async getAsset(@ContextParam() context: Context) {
    return await this.handleRequest(context, false)
  }

  private async handleRequest(context: Context, headOnly: boolean): Promise<Response> {
    const service = this.resolveService(context.req.path)
    return await this.serve(context, service, headOnly)
  }

  private async serve(context: Context, service: StaticAssetService, headOnly: boolean): Promise<Response> {
    const pathname = context.req.path
    const normalizedPath = this.normalizeRequestPath(pathname, service)
    const response = await service.handleRequest(normalizedPath, headOnly)
    if (response) {
      return response
    }

    return headOnly ? new Response(null, { status: 404 }) : new Response('Not Found', { status: 404 })
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

  private isHtmlRoute(pathname: string): boolean {
    if (!pathname) {
      return true
    }

    const normalized = pathname.split('?')[0]?.trim() ?? ''
    if (!normalized || normalized === '/' || normalized.endsWith('/')) {
      return true
    }

    const lastSegment = normalized.split('/').pop()
    if (!lastSegment) {
      return true
    }

    if (lastSegment.endsWith('.html')) {
      return true
    }

    return !lastSegment.includes('.')
  }

  private shouldRenderTenantMissingPage(): boolean {
    const tenantContext = getTenantContext()
    return !tenantContext || isPlaceholderTenantContext(tenantContext)
  }

  private async renderTenantMissingPage(): Promise<Response> {
    const response = await this.staticDashboardService.handleRequest(TENANT_MISSING_ENTRY_PATH, false)
    if (response) {
      return this.cloneResponseWithStatus(response, 404)
    }

    return new Response('Workspace unavailable', { status: 404 })
  }

  private cloneResponseWithStatus(response: Response, status: number): Response {
    const headers = new Headers(response.headers)
    return new Response(response.body, {
      status,
      headers,
    })
  }
}
