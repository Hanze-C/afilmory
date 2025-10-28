import { authUsers } from '@afilmory/db'
import { Body, ContextParam, Controller, Get, Post, UnauthorizedException } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'

import { DbAccessor } from '../../database/database.provider'
import { RoleBit, Roles } from '../../guards/roles.decorator'
import { SuperAdminSettingService } from '../system-setting/super-admin-setting.service'
import { AuthProvider } from './auth.provider'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthProvider,
    private readonly dbAccessor: DbAccessor,
    private readonly superAdminSettings: SuperAdminSettingService,
  ) {}

  @Get('/session')
  async getSession(@ContextParam() context: Context) {
    const auth = this.auth.getAuth()
    // forward tenant headers so Better Auth can persist tenantId via databaseHooks
    const headers = new Headers(context.req.raw.headers)
    const tenant = (context as any).var?.tenant
    if (tenant?.tenant?.id) {
      headers.set('x-tenant-id', tenant.tenant.id)
      if (tenant.tenant.slug) headers.set('x-tenant-slug', tenant.tenant.slug)
    }
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw new UnauthorizedException()
    }
    return { user: session.user, session: session.session }
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
