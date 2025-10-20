import { env } from '@afilmory/env'
import type { CanActivate, ExecutionContext } from '@afilmory/framework'
import { UnauthorizedException } from '@afilmory/framework'
import { injectable } from 'tsyringe'

@injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { hono } = context.getContext()
    const apiKey = hono.req.header('x-api-key')
    const expected = env.API_KEY ?? 'secret-key'

    if (apiKey !== expected) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid API key',
      })
    }

    return true
  }
}
