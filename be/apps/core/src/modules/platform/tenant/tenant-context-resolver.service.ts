import { env } from '@afilmory/env'
import { HttpContext } from '@afilmory/framework'
import { DEFAULT_BASE_DOMAIN } from '@afilmory/utils'
import { BizException, ErrorCode } from 'core/errors'
import { logger } from 'core/helpers/logger.helper'
import { SystemSettingService } from 'core/modules/configuration/system-setting/system-setting.service'
import { AppStateService } from 'core/modules/infrastructure/app-state/app-state.service'
import type { Context } from 'hono'
import { injectable } from 'tsyringe'

import { PLACEHOLDER_TENANT_SLUG, ROOT_TENANT_SLUG } from './tenant.constants'
import { TenantService } from './tenant.service'
import type { TenantAggregate, TenantContext } from './tenant.types'
import { extractTenantSlugFromHost } from './tenant-host.utils'

const HEADER_TENANT_ID = 'x-tenant-id'
const HEADER_TENANT_SLUG = 'x-tenant-slug'
const ROOT_TENANT_PATH_PREFIXES = [
  '/api/super-admin',
  '/api/settings',
  '/api/storage/settings',
  '/api/builder/settings',
] as const

export interface TenantResolutionOptions {
  throwOnMissing?: boolean
  setResponseHeaders?: boolean
  skipInitializationCheck?: boolean
}

@injectable()
export class TenantContextResolver {
  private readonly log = logger.extend('TenantResolver')

  constructor(
    private readonly tenantService: TenantService,
    private readonly appState: AppStateService,
    private readonly systemSettingService: SystemSettingService,
  ) {}

  async resolve(context: Context, options: TenantResolutionOptions = {}): Promise<TenantContext | null> {
    const existing = this.getExistingContext()
    if (existing) {
      if (options.setResponseHeaders !== false) {
        this.applyTenantHeaders(context, existing)
      }
      return existing
    }

    if (!options.skipInitializationCheck) {
      const initialized = await this.appState.isInitialized()
      if (!initialized) {
        this.log.info(`Application not initialized yet, skip tenant resolution for ${context.req.path}`)
        return null
      }
    }

    const forwardedHost = context.req.header('x-forwarded-host')
    const origin = context.req.header('origin')
    const hostHeader = context.req.header('host')
    const host = this.normalizeHost(forwardedHost ?? hostHeader ?? null, origin)

    this.log.debug(`Forwarded host: ${forwardedHost}, Host header: ${hostHeader}, Origin: ${origin}, Host: ${host}`)

    const tenantId = this.normalizeString(context.req.header(HEADER_TENANT_ID))
    const tenantSlugHeader = this.normalizeSlug(context.req.header(HEADER_TENANT_SLUG))

    const baseDomain = await this.getBaseDomain()

    let derivedSlug = host ? (extractTenantSlugFromHost(host, baseDomain) ?? undefined) : undefined
    if (!derivedSlug && host && this.isBaseDomainHost(host, baseDomain)) {
      derivedSlug = ROOT_TENANT_SLUG
    }
    if (!derivedSlug && this.isRootTenantPath(context.req.path)) {
      derivedSlug = ROOT_TENANT_SLUG
    }

    const requestedSlug = derivedSlug ?? tenantSlugHeader ?? null
    if (!derivedSlug) {
      derivedSlug = tenantSlugHeader
    }
    this.log.verbose(
      `Resolve tenant for request ${context.req.method} ${context.req.path} (host=${host ?? 'n/a'}, id=${tenantId ?? 'n/a'}, slug=${derivedSlug ?? 'n/a'})`,
    )

    let tenantContext = await this.tenantService.resolve(
      {
        tenantId,
        slug: derivedSlug,
      },
      true,
    )

    if (!tenantContext && this.shouldFallbackToPlaceholder(tenantId, derivedSlug)) {
      const placeholder = await this.tenantService.ensurePlaceholderTenant()
      tenantContext = this.asTenantContext(placeholder, true, requestedSlug)
      this.log.verbose(
        `Applied placeholder tenant context for ${context.req.method} ${context.req.path} (host=${host ?? 'n/a'})`,
      )
    } else if (tenantContext) {
      tenantContext = this.asTenantContext(
        tenantContext,
        tenantContext.tenant.slug === PLACEHOLDER_TENANT_SLUG,
        requestedSlug ?? tenantContext.tenant.slug ?? null,
      )
    }

    if (!tenantContext) {
      if (options.throwOnMissing && (tenantId || derivedSlug)) {
        throw new BizException(ErrorCode.TENANT_NOT_FOUND)
      }
      return null
    }

    if (options.setResponseHeaders !== false) {
      this.applyTenantHeaders(context, tenantContext)
    }

    return tenantContext
  }

  private isBaseDomainHost(host: string, baseDomain: string): boolean {
    const parsed = this.parseHost(host)
    if (!parsed.hostname) {
      return false
    }

    const normalizedHost = parsed.hostname.trim().toLowerCase()
    const normalizedBase = baseDomain.trim().toLowerCase()

    if (normalizedBase === 'localhost') {
      return normalizedHost === 'localhost' && this.matchesServerPort(parsed.port)
    }

    return normalizedHost === normalizedBase && this.matchesServerPort(parsed.port)
  }

  private parseHost(host: string): { hostname: string | null; port: string | null } {
    if (!host) {
      return { hostname: null, port: null }
    }

    if (host.startsWith('[')) {
      // IPv6 literal (e.g. [::1]:3000)
      const closingIndex = host.indexOf(']')
      if (closingIndex === -1) {
        return { hostname: host, port: null }
      }
      const hostname = host.slice(1, closingIndex)
      const portSegment = host.slice(closingIndex + 1)
      const port = portSegment.startsWith(':') ? portSegment.slice(1) : null
      return { hostname, port: port && port.length > 0 ? port : null }
    }

    const [hostname, port] = host.split(':', 2)
    return { hostname: hostname ?? null, port: port ?? null }
  }

  private matchesServerPort(port: string | null): boolean {
    if (!port) {
      return true
    }
    const parsed = Number.parseInt(port, 10)
    if (Number.isNaN(parsed)) {
      return false
    }
    return parsed === env.PORT
  }

  private isRootTenantPath(path: string | undefined): boolean {
    if (!path) {
      return false
    }
    const normalizedPath = path.toLowerCase()
    return ROOT_TENANT_PATH_PREFIXES.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix.toLowerCase()}/`),
    )
  }

  private getExistingContext(): TenantContext | null {
    try {
      return (HttpContext.getValue('tenant') as TenantContext | undefined) ?? null
    } catch {
      return null
    }
  }

  private applyTenantHeaders(context: Context, tenantContext: TenantContext): void {
    context.header(HEADER_TENANT_ID, tenantContext.tenant.id)
    const effectiveSlug = tenantContext.requestedSlug ?? tenantContext.tenant.slug
    if (effectiveSlug) {
      context.header(HEADER_TENANT_SLUG, effectiveSlug)
    }
  }

  private async getBaseDomain(): Promise<string> {
    if (process.env.NODE_ENV === 'development') {
      return 'localhost'
    }
    const settings = await this.systemSettingService.getSettings()
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

  private shouldFallbackToPlaceholder(tenantId?: string, slug?: string): boolean {
    return !(tenantId && tenantId.length > 0) && !(slug && slug.length > 0)
  }

  private asTenantContext(
    source: TenantAggregate,
    isPlaceholder: boolean,
    requestedSlug: string | null,
  ): TenantContext {
    return {
      tenant: source.tenant,
      isPlaceholder,
      requestedSlug,
    }
  }
}
