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

const ROOT_TENANT_PATH_PREFIXES = [
  '/api/super-admin',
  '/api/settings',
  '/api/storage/settings',
  '/api/builder/settings',
] as const

export interface TenantResolutionOptions {
  throwOnMissing?: boolean
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

    const baseDomain = await this.getBaseDomain()
    let derivedSlug = host ? (extractTenantSlugFromHost(host, baseDomain) ?? undefined) : undefined
    if (!derivedSlug && this.isRootTenantPath(context.req.path)) {
      derivedSlug = ROOT_TENANT_SLUG
    }

    const requestedSlug = derivedSlug ?? null
    this.log.verbose(
      `Resolve tenant for request ${context.req.method} ${context.req.path} (host=${host ?? 'n/a'}, slug=${derivedSlug ?? 'n/a'})`,
    )

    let tenantContext: TenantContext | null = null
    if (derivedSlug) {
      tenantContext = await this.tenantService.resolve(
        {
          slug: derivedSlug,
        },
        true,
      )
    }

    if (!tenantContext && this.shouldFallbackToPlaceholder(derivedSlug)) {
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
      if (options.throwOnMissing && derivedSlug) {
        throw new BizException(ErrorCode.TENANT_NOT_FOUND)
      }
      return null
    }

    return tenantContext
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

  private shouldFallbackToPlaceholder(slug?: string | null): boolean {
    return !slug
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
