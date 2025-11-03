import { authUsers } from '@afilmory/db'
import { Body, ContextParam, Controller, Get, HttpContext, Post, UnauthorizedException } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'

import { DbAccessor } from '../../database/database.provider'
import { RoleBit, Roles } from '../../guards/roles.decorator'
import { SuperAdminSettingService } from '../system-setting/super-admin-setting.service'
import { AuthProvider } from './auth.provider'
import { AuthRegistrationService } from './auth-registration.service'

type TenantSignUpRequest = {
  account?: {
    email?: string
    password?: string
    name?: string
  }
  tenant?: {
    name?: string
    slug?: string | null
    domain?: string | null
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthProvider,
    private readonly dbAccessor: DbAccessor,
    private readonly superAdminSettings: SuperAdminSettingService,
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
      source: authContext.source ?? 'global',
    }
  }

  @Post('/sign-in/email')
  async signInEmail(@ContextParam() context: Context, @Body() body: { email: string; password: string }) {
    const email = body.email.trim()
    if (email.length === 0) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '邮箱不能为空' })
    }
    const settings = await this.superAdminSettings.getSettings()
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

    const auth = this.auth.getAuth()
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

  @Post('/tenants/sign-up')
  async signUpTenant(@ContextParam() context: Context, @Body() body: TenantSignUpRequest) {
    if (!body?.account || !body?.tenant) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '缺少注册信息' })
    }

    const headers = new Headers(context.req.raw.headers)

    const result = await this.registration.registerTenant(
      {
        account: {
          email: body.account.email ?? '',
          password: body.account.password ?? '',
          name: body.account.name ?? '',
        },
        tenant: {
          name: body.tenant.name ?? '',
          slug: body.tenant.slug ?? null,
          domain: body.tenant.domain ?? null,
        },
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
