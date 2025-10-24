import type { HttpMiddleware, OnModuleDestroy, OnModuleInit } from '@afilmory/framework'
import { EventEmitterService, Middleware } from '@afilmory/framework'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import { injectable } from 'tsyringe'

import { logger } from '../helpers/logger.helper'
import { SettingService } from '../modules/setting/setting.service'
import { getTenantContext } from '../modules/tenant/tenant.context'
import { TenantService } from '../modules/tenant/tenant.service'

type AllowedOrigins = '*' | string[]

function normalizeOriginValue(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '*') {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    return `${url.protocol}//${url.host}`
  } catch {
    return trimmed.replace(/\/+$/, '')
  }
}

function parseAllowedOrigins(raw: string | null): AllowedOrigins {
  if (!raw) {
    return '*'
  }

  const entries = raw
    .split(/[\n,]/)
    .map((value) => normalizeOriginValue(value))
    .filter((value) => value.length > 0)

  if (entries.length === 0 || entries.includes('*')) {
    return '*'
  }

  return Array.from(new Set(entries))
}

@Middleware({ path: '/*', priority: -100 })
@injectable()
export class CorsMiddleware implements HttpMiddleware, OnModuleInit, OnModuleDestroy {
  private readonly allowedOrigins = new Map<string, AllowedOrigins>()
  private defaultTenantId?: string
  private readonly logger = logger.extend('CorsMiddleware')
  private readonly corsMiddleware = cors({
    origin: (origin) => this.resolveOrigin(origin),
    credentials: true,
  })

  private readonly handleSettingUpdated = ({
    tenantId,
    key,
    value,
  }: {
    tenantId: string
    key: string
    value: string
  }) => {
    if (key !== 'http.cors.allowedOrigins') {
      return
    }
    void this.reloadAllowedOrigins(tenantId)
  }

  private readonly handleSettingDeleted = ({ tenantId, key }: { tenantId: string; key: string }) => {
    if (key !== 'http.cors.allowedOrigins') {
      return
    }
    this.allowedOrigins.delete(tenantId)
  }

  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly settingService: SettingService,
    private readonly tenantService: TenantService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const defaultTenant = await this.tenantService.getDefaultTenant()
      this.defaultTenantId = defaultTenant.tenant.id
      await this.reloadAllowedOrigins(defaultTenant.tenant.id)
    } catch (error) {
      this.logger.warn('Failed to preload default tenant CORS configuration', error)
    }
    this.eventEmitter.on('setting.updated', this.handleSettingUpdated)
    this.eventEmitter.on('setting.deleted', this.handleSettingDeleted)
  }

  async onModuleDestroy(): Promise<void> {
    this.eventEmitter.off('setting.updated', this.handleSettingUpdated)
    this.eventEmitter.off('setting.deleted', this.handleSettingDeleted)
  }

  async use(context: Context, next: Next): Promise<Response | void> {
    const tenantContext = getTenantContext()
    const tenantId = tenantContext?.tenant.id ?? this.defaultTenantId

    if (tenantId) {
      await this.ensureTenantOriginsLoaded(tenantId)
    } else {
      this.logger.warn('Tenant context missing for request %s %s', context.req.method, context.req.path)
    }

    return await this.corsMiddleware(context, next)
  }

  private async ensureTenantOriginsLoaded(tenantId: string): Promise<void> {
    if (this.allowedOrigins.has(tenantId)) {
      return
    }

    await this.reloadAllowedOrigins(tenantId)
  }

  private async reloadAllowedOrigins(tenantId: string): Promise<void> {
    let raw: string | null = null

    try {
      raw = await this.settingService.get('http.cors.allowedOrigins', { tenantId })
    } catch (error) {
      this.logger.warn('Failed to load CORS configuration from settings for tenant %s', tenantId, error)
    }

    this.updateAllowedOrigins(tenantId, raw)
  }

  private updateAllowedOrigins(tenantId: string, next: string | null): void {
    const parsed = parseAllowedOrigins(next)
    this.allowedOrigins.set(tenantId, parsed)
    this.logger.info(
      'Updated CORS allowed origins for tenant %s %s',
      tenantId,
      parsed === '*' ? '*' : JSON.stringify(parsed),
    )
  }

  private resolveOrigin(origin: string | undefined): string | null {
    if (!origin) {
      return null
    }

    const normalized = normalizeOriginValue(origin)

    if (!normalized) {
      return null
    }

    const tenantContext = getTenantContext()
    const tenantId = tenantContext?.tenant.id ?? this.defaultTenantId

    if (!tenantId) {
      return null
    }

    const allowed = this.allowedOrigins.get(tenantId)

    if (!allowed) {
      return null
    }

    if (allowed === '*') {
      return normalized
    }

    return allowed.includes(normalized) ? normalized : null
  }
}
