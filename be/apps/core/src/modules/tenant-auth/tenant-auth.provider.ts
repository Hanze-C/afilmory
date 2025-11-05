import { generateId, tenantAuthAccounts, tenantAuthSessions, tenantAuthUsers } from '@afilmory/db'
import type { OnModuleDestroy, OnModuleInit } from '@afilmory/framework'
import { EventEmitterService } from '@afilmory/framework'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthMiddleware } from 'better-auth/api'
import type { Context } from 'hono'
import { injectable } from 'tsyringe'

import { DrizzleProvider } from '../../database/database.provider'
import { TENANT_AUTH_CONFIG_SETTING_KEY, TenantAuthConfigService } from './tenant-auth.config'

export type TenantBetterAuthInstance = ReturnType<typeof betterAuth>
export type TenantAuthSession = TenantBetterAuthInstance['$Infer']['Session']

@injectable()
export class TenantAuthProvider implements OnModuleInit, OnModuleDestroy {
  private readonly cache = new Map<string, TenantBetterAuthInstance>()

  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly configService: TenantAuthConfigService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.eventEmitter.on('setting.updated', this.handleSettingUpdated)
    this.eventEmitter.on('setting.deleted', this.handleSettingDeleted)
  }

  async onModuleDestroy(): Promise<void> {
    this.eventEmitter.off('setting.updated', this.handleSettingUpdated)
    this.eventEmitter.off('setting.deleted', this.handleSettingDeleted)
    this.cache.clear()
  }

  private readonly handleSettingUpdated = ({ tenantId, key }: { tenantId: string; key: string }) => {
    if (key !== TENANT_AUTH_CONFIG_SETTING_KEY) {
      return
    }
    this.cache.delete(tenantId)
  }

  private readonly handleSettingDeleted = ({ tenantId, key }: { tenantId: string; key: string }) => {
    if (key !== TENANT_AUTH_CONFIG_SETTING_KEY) {
      return
    }
    this.cache.delete(tenantId)
  }

  async getAuth(tenantId: string): Promise<TenantBetterAuthInstance> {
    const cached = this.cache.get(tenantId)
    if (cached) {
      return cached
    }

    const db = this.drizzleProvider.getDb()
    const tenantOptions = await this.configService.getOptions(tenantId)

    const instance = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          user: tenantAuthUsers,
          session: tenantAuthSessions,
          account: tenantAuthAccounts,
        },
      }),
      emailAndPassword: { enabled: tenantOptions.localProviderEnabled },
      socialProviders: tenantOptions.socialProviders,
      user: {
        additionalFields: {
          tenantId: { type: 'string', input: false },
          role: { type: 'string', input: false },
        },
      },
      databaseHooks: {
        user: {
          create: {
            before: async (user) => ({
              data: {
                ...user,
                tenantId,
                role: user.role ?? 'guest',
              },
            }),
          },
        },
        session: {
          create: {
            before: async (session) => ({
              data: {
                ...session,
                tenantId,
              },
            }),
          },
        },
        account: {
          create: {
            before: async (account) => ({
              data: {
                ...account,
                tenantId,
              },
            }),
          },
        },
      },
      advanced: {
        database: {
          generateId: () => generateId(),
        },
      },
      hooks: {
        before: createAuthMiddleware(async (ctx) => {
          if (ctx.path === '/sign-up/email' && !tenantOptions.localProviderEnabled) {
            throw new Response(JSON.stringify({ message: '当前租户未启用邮件注册，请联系管理员获取访问权限。' }), {
              status: 403,
              headers: { 'content-type': 'application/json' },
            })
          }
        }),
      },
    })

    this.cache.set(tenantId, instance)
    return instance
  }

  async handler(context: Context, tenantId: string): Promise<Response> {
    const auth = await this.getAuth(tenantId)
    return auth.handler(context.req.raw)
  }
}
