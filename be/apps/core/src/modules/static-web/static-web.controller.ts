import { ContextParam, Controller, Get, Head } from '@afilmory/framework'
import type { Context } from 'hono'

import { StaticWebService } from './static-web.service'

@Controller('static/web')
export class StaticWebController {
  constructor(private readonly staticWebService: StaticWebService) {}

  @Get('/*')
  async getAsset(@ContextParam() context: Context) {
    const response = await this.staticWebService.handleRequest(context.req.path, false)
    return response ?? new Response('Not Found', { status: 404 })
  }

  @Head('/*')
  async headAsset(@ContextParam() context: Context) {
    const response = await this.staticWebService.handleRequest(context.req.path, true)
    return response ?? new Response(null, { status: 404 })
  }
}
