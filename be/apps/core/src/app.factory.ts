import 'reflect-metadata'

import { env } from '@afilmory/env'
import type { HonoHttpApplication } from '@afilmory/framework'
import { createApplication, createZodValidationPipe } from '@afilmory/framework'

import { PgPoolProvider } from './database/database.provider'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { LoggingInterceptor } from './interceptors/logging.interceptor'
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor'
import { AppModules } from './modules/index.module'
import { registerOpenApiRoutes } from './openapi'
import { RedisProvider } from './redis/redis.provider'

export interface BootstrapOptions {
  globalPrefix?: string
}

const isDevelopment = env.NODE_ENV !== 'production'

const GlobalValidationPipe = createZodValidationPipe({
  transform: true,
  whitelist: true,
  errorHttpStatusCode: 422,
  forbidUnknownValues: true,
  enableDebugMessages: isDevelopment,
  stopAtFirstError: true,
})

export async function createConfiguredApp(options: BootstrapOptions = {}): Promise<HonoHttpApplication> {
  const app = await createApplication(AppModules, {
    globalPrefix: options.globalPrefix ?? '/api',
  })

  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalInterceptors(new ResponseTransformInterceptor())

  app.useGlobalPipes(new GlobalValidationPipe())

  // Warm up DB connection during bootstrap
  const container = app.getContainer()
  const poolProvider = container.resolve(PgPoolProvider)
  await poolProvider.warmup()

  // Warm up Redis connection during bootstrap
  const redisProvider = container.resolve(RedisProvider)
  await redisProvider.warmup()

  registerOpenApiRoutes(app.getInstance(), { globalPrefix: options.globalPrefix ?? '/api' })

  return app
}
