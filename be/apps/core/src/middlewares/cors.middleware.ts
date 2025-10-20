import type { HttpMiddleware, OnModuleDestroy, OnModuleInit } from '@afilmory/framework'
import { EventEmitterService, Middleware } from '@afilmory/framework'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import { injectable } from 'tsyringe'

import { logger } from '../helpers/logger.helper'
import { SettingService } from '../modules/setting/setting.service'

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
  private allowedOrigins: AllowedOrigins = []
  private readonly logger = logger.extend('CorsMiddleware')
  private readonly corsMiddleware = cors({
    origin: (origin) => this.resolveOrigin(origin),
    credentials: true,
  })

  private readonly handleSettingUpdated = ({ key, value }: { key: string; value: string }) => {
    if (key !== 'http.cors.allowedOrigins') {
      return
    }
    this.updateAllowedOrigins(value)
  }

  private readonly handleSettingDeleted = ({ key }: { key: string }) => {
    if (key !== 'http.cors.allowedOrigins') {
      return
    }
    this.updateAllowedOrigins(null)
  }

  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly settingService: SettingService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reloadAllowedOrigins()
    this.eventEmitter.on('setting.updated', this.handleSettingUpdated)
    this.eventEmitter.on('setting.deleted', this.handleSettingDeleted)
  }

  async onModuleDestroy(): Promise<void> {
    this.eventEmitter.off('setting.updated', this.handleSettingUpdated)
    this.eventEmitter.off('setting.deleted', this.handleSettingDeleted)
  }

  async use(context: Context, next: Next): Promise<Response | void> {
    return await this.corsMiddleware(context, next)
  }

  private async reloadAllowedOrigins(): Promise<void> {
    let raw: string | null = null

    try {
      raw = await this.settingService.get('http.cors.allowedOrigins', {})
    } catch (error) {
      this.logger.warn('Failed to load CORS configuration from settings', error)
    }

    this.updateAllowedOrigins(raw)
  }

  private updateAllowedOrigins(next: string | null): void {
    this.allowedOrigins = parseAllowedOrigins(next)
    this.logger.info('Updated CORS allowed origins', this.allowedOrigins === '*' ? '*' : this.allowedOrigins)
  }

  private resolveOrigin(origin: string | undefined): string | null {
    if (!origin) {
      return null
    }

    const normalized = normalizeOriginValue(origin)

    if (!normalized) {
      return null
    }

    if (this.allowedOrigins === '*') {
      return normalized
    }

    return this.allowedOrigins.includes(normalized) ? normalized : null
  }
}
