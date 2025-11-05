import { Body, ContextParam, Controller, Get, Post } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'
import { requireTenantContext } from 'core/modules/tenant/tenant.context'
import type { Context } from 'hono'

import { TenantAuthConfigService } from './tenant-auth.config'
import { TenantAuthProvider } from './tenant-auth.provider'

type TenantAuthEmailPayload = {
  email: string
  password: string
  name?: string
}

@Controller('tenant-auth')
export class TenantAuthController {
  constructor(
    private readonly tenantAuthProvider: TenantAuthProvider,
    private readonly tenantAuthConfig: TenantAuthConfigService,
  ) {}

  @Get('/session')
  async getSession(@ContextParam() context: Context) {
    const tenant = requireTenantContext()
    const auth = await this.tenantAuthProvider.getAuth(tenant.tenant.id)
    const session = await auth.api.getSession({ headers: context.req.raw.headers })

    if (!session) {
      throw new BizException(ErrorCode.AUTH_UNAUTHORIZED)
    }

    context.header('x-tenant-id', tenant.tenant.id)
    context.header('x-tenant-slug', tenant.tenant.slug)

    return { user: session.user, session: session.session, source: 'tenant' as const }
  }

  @Post('/sign-in/email')
  async signInEmail(@ContextParam() context: Context, @Body() body: TenantAuthEmailPayload) {
    const tenant = requireTenantContext()
    const email = body?.email?.trim() ?? ''
    const password = body?.password ?? ''

    if (!email) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '邮箱不能为空' })
    }

    if (!password) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '密码不能为空' })
    }

    const config = await this.tenantAuthConfig.getOptions(tenant.tenant.id)

    if (!config.localProviderEnabled) {
      throw new BizException(ErrorCode.AUTH_FORBIDDEN, {
        message: '当前租户已关闭邮箱密码登录，请联系管理员获取访问权限。',
      })
    }

    const auth = await this.tenantAuthProvider.getAuth(tenant.tenant.id)
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: context.req.raw.headers,
      asResponse: true,
    })

    context.header('x-tenant-id', tenant.tenant.id)
    context.header('x-tenant-slug', tenant.tenant.slug)

    return response
  }

  @Post('/sign-up/email')
  async signUpEmail(@ContextParam() context: Context, @Body() body: TenantAuthEmailPayload) {
    const tenant = requireTenantContext()
    const email = body?.email?.trim() ?? ''
    const password = body?.password ?? ''
    const name = body?.name?.trim() || email

    if (!email) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '邮箱不能为空' })
    }

    if (!password) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '密码不能为空' })
    }

    const config = await this.tenantAuthConfig.getOptions(tenant.tenant.id)

    if (!config.localProviderEnabled) {
      throw new BizException(ErrorCode.AUTH_FORBIDDEN, {
        message: '当前租户已关闭邮箱注册，请联系管理员开启后再试。',
      })
    }

    const auth = await this.tenantAuthProvider.getAuth(tenant.tenant.id)
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: context.req.raw.headers,
      asResponse: true,
    })

    context.header('x-tenant-id', tenant.tenant.id)
    context.header('x-tenant-slug', tenant.tenant.slug)

    return response
  }

  @Get('/*')
  async passthroughGet(@ContextParam() context: Context) {
    const tenant = requireTenantContext()
    return await this.tenantAuthProvider.handler(context, tenant.tenant.id)
  }

  @Post('/*')
  async passthroughPost(@ContextParam() context: Context) {
    const tenant = requireTenantContext()
    return await this.tenantAuthProvider.handler(context, tenant.tenant.id)
  }
}
