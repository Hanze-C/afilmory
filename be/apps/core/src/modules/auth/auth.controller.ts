import { Body, ContextParam, Controller, Get, Post, UnauthorizedException } from '@afilmory/framework'
import type { Context } from 'hono'

import { RoleBit, Roles } from '../../guards/roles.decorator'
import { AuthProvider } from './auth.provider'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthProvider) {}

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
    const auth = this.auth.getAuth()
    const headers = new Headers(context.req.raw.headers)
    const tenant = (context as any).var?.tenant
    if (tenant?.tenant?.id) {
      headers.set('x-tenant-id', tenant.tenant.id)
      if (tenant.tenant.slug) headers.set('x-tenant-slug', tenant.tenant.slug)
    }
    const response = await auth.api.signInEmail({
      body: {
        email: body.email,
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
