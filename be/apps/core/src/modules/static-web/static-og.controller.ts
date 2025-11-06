import { ContextParam, Controller, createZodSchemaDto,Get, Param } from '@afilmory/framework'
import type { Context } from 'hono'
import { z } from 'zod'

import { StaticOgService } from './static-og.service'

const OgParamsSchema = z.object({
  photoId: z.string().min(1),
})

class OgParamsDto extends createZodSchemaDto(OgParamsSchema) {}

@Controller({ prefix: 'og', bypassGlobalPrefix: true })
export class StaticOgController {
  constructor(private readonly staticOgService: StaticOgService) {}

  @Get('/:photoId')
  async render(@Param() params: OgParamsDto, @ContextParam() context: Context) {
    return this.staticOgService.render(context, params.photoId)
  }
}
