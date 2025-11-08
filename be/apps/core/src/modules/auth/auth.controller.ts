import { authUsers } from '@afilmory/db'
import { Body, ContextParam, Controller, Get, HttpContext, Post, UnauthorizedException } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'

import { DbAccessor } from '../../database/database.provider'
import { RoleBit, Roles } from '../../guards/roles.decorator'
import { SystemSettingService } from '../system-setting/system-setting.service'
import { getTenantContext } from '../tenant/tenant.context'
import type { SocialProvidersConfig } from './auth.config'
import { AuthProvider } from './auth.provider'
import { AuthRegistrationService } from './auth-registration.service'

const SOCIAL_PROVIDER_METADATA: Record<string, { name: string; icon: string }> = {
  google: {
    name: 'Google',
    icon: 'i-simple-icons-google',
  },
  github: {
    name: 'GitHub',
    icon: 'i-simple-icons-github',
  },
}

function resolveSocialProviderMetadata(id: string): { name: string; icon: string } {
  const metadata = SOCIAL_PROVIDER_METADATA[id]
  if (metadata) {
    return metadata
  }
  const formattedId = id.replaceAll(/[-_]/g, ' ').replaceAll(/\b\w/g, (match) => match.toUpperCase())
  return {
    name: formattedId.trim() || id,
    icon: 'i-mingcute-earth-2-line',
  }
}

function buildProviderResponse(socialProviders: SocialProvidersConfig) {
  return Object.entries(socialProviders)
    .filter(([, config]) => Boolean(config))
    .map(([id, config]) => {
      const metadata = resolveSocialProviderMetadata(id)
      return {
        id,
        name: metadata.name,
        icon: metadata.icon,
        callbackPath: config?.redirectPath ?? null,
      }
    })
}

type TenantSignUpRequest = {
  account?: {
    email?: string
    password?: string
    name?: string
  }
  tenant?: {
    name?: string
    slug?: string | null
  }
  settings?: Array<{ key?: string; value?: unknown }>
}

type SocialSignInRequest = {
  provider: string
  requestSignUp?: boolean
  callbackURL?: string
  errorCallbackURL?: string
  newUserCallbackURL?: string
  disableRedirect?: boolean
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthProvider,
    private readonly dbAccessor: DbAccessor,
    private readonly systemSettings: SystemSettingService,
    private readonly registration: AuthRegistrationService,
  ) {}

  @Get('/session')
  async getSession(@ContextParam() _context: Context) {
    const authContext = HttpContext.getValue('auth')
    if (!authContext?.user || !authContext.session) {
      throw new UnauthorizedException()
    }
    return {
      user: authContext.user,
      session: authContext.session,
    }
  }

  @Get('/social/providers')
  async getSocialProviders() {
    const { socialProviders } = await this.systemSettings.getAuthModuleConfig()
    return { providers: buildProviderResponse(socialProviders) }
  }

  @Post('/sign-in/email')
  async signInEmail(@ContextParam() context: Context, @Body() body: { email: string; password: string }) {
    const email = body.email.trim()
    if (email.length === 0) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '邮箱不能为空' })
    }
    const settings = await this.systemSettings.getSettings()
    if (!settings.localProviderEnabled) {
      const db = this.dbAccessor.get()
      const [record] = await db
        .select({ role: authUsers.role })
        .from(authUsers)
        .where(eq(authUsers.email, email))
        .limit(1)

      const isSuperAdmin = record?.role === 'superadmin'
      if (!isSuperAdmin) {
        throw new BizException(ErrorCode.AUTH_FORBIDDEN, {
          message: '邮箱密码登录已禁用，请联系管理员开启本地登录。',
        })
      }
    }

    const auth = await this.auth.getAuth()
    const headers = new Headers(context.req.raw.headers)
    const tenant = (context as any).var?.tenant
    if (tenant?.tenant?.id) {
      headers.set('x-tenant-id', tenant.tenant.id)
      if (tenant.tenant.slug) headers.set('x-tenant-slug', tenant.tenant.slug)
    }
    const response = await auth.api.signInEmail({
      body: {
        email,
        password: body.password,
      },
      asResponse: true,
      headers,
    })
    return response
  }

  @Post('/social')
  async signInSocial(@ContextParam() context: Context, @Body() body: SocialSignInRequest) {
    const provider = body?.provider?.trim()
    if (!provider) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '缺少 OAuth Provider 参数' })
    }

    const headers = new Headers(context.req.raw.headers)
    const tenantContext = getTenantContext()

    if (tenantContext) {
      headers.set('x-tenant-id', tenantContext.tenant.id)
      if (tenantContext.tenant.slug) {
        headers.set('x-tenant-slug', tenantContext.tenant.slug)
      }
    }

    const auth = await this.auth.getAuth()
    const response = await auth.api.signInSocial({
      body: {
        ...body,
        provider,
        requestSignUp: body.requestSignUp ?? Boolean(tenantContext),
      },
      headers,
      asResponse: true,
    })

    if (tenantContext) {
      context.header('x-tenant-id', tenantContext.tenant.id)
      if (tenantContext.tenant.slug) {
        context.header('x-tenant-slug', tenantContext.tenant.slug)
      }
    }

    return response
  }

  @Post('/sign-in/email')
  async signUpEmail(@ContextParam() context: Context, @Body() body: TenantSignUpRequest) {
    if (!body?.account) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '缺少注册账号信息' })
    }

    const tenantContext = getTenantContext()
    if (!tenantContext && !body.tenant) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '缺少租户信息' })
    }

    const headers = new Headers(context.req.raw.headers)
    if (tenantContext) {
      headers.set('x-tenant-id', tenantContext.tenant.id)
      if (tenantContext.tenant.slug) {
        headers.set('x-tenant-slug', tenantContext.tenant.slug)
      }
    }

    const result = await this.registration.registerTenant(
      {
        account: {
          email: body.account.email ?? '',
          password: body.account.password ?? '',
          name: body.account.name ?? '',
        },
        tenant: body.tenant
          ? {
              name: body.tenant.name ?? '',
              slug: body.tenant.slug ?? null,
            }
          : undefined,
        settings: body.settings?.filter(
          (s): s is { key: string; value: unknown } => typeof s.key === 'string' && s.key.length > 0,
        ),
      },
      headers,
    )

    if (result.success && result.tenant) {
      context.header('x-tenant-id', result.tenant.id)
      context.header('x-tenant-slug', result.tenant.slug)
    }

    return result.response
  }

  @Get('/admin-only')
  @Roles(RoleBit.ADMIN)
  async adminOnly(@ContextParam() _context: Context) {
    return { ok: true }
  }

  @Get('/*')
  async passthroughGet(@ContextParam() context: Context) {
    return await this.auth.handler(context)
  }

  @Post('/*')
  async passthroughPost(@ContextParam() context: Context) {
    return await this.auth.handler(context)
  }
}
