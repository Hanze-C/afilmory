import 'reflect-metadata'

import { env } from '@afilmory/env'
import { serve } from '@hono/node-server'
import { green } from 'picocolors'

import { createConfiguredApp } from './app.factory'
import { logger } from './helpers/logger.helper'

process.title = 'Hono HTTP Server'

async function bootstrap() {
  const app = await createConfiguredApp({
    globalPrefix: '/api',
  })

  const hono = app.getInstance()
  const port = env.PORT

  const hostname = env.HOSTNAME
  const server = serve({
    fetch: hono.fetch,
    port,
    hostname,
  })

  void server

  logger.info(
    `Hono HTTP application started on http://${hostname}:${port}. ${green(`+${performance.now().toFixed(2)}ms`)}`,
  )
}

bootstrap().catch((error) => {
  console.error('Application bootstrap failed', error)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})
