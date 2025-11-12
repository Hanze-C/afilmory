import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { gatewayConfig } from './config'
import { buildForwardLocation, resolveTargetHost, sanitizeExplicitHost, sanitizeTenantSlug } from './resolver'

const app = new Hono()

app.get('/healthz', (c) =>
  c.json({
    status: 'ok',
    service: 'oauth-gateway',
    timestamp: new Date().toISOString(),
  }),
)

const callbackRouter = new Hono()

callbackRouter.all('/:provider', (c) => {
  const provider = c.req.param('provider')
  if (!provider) {
    return c.json({ error: 'missing_provider', message: 'Provider param is required.' }, 400)
  }

  const requestUrl = new URL(c.req.url)
  const tenantSlugParam = requestUrl.searchParams.get('tenantSlug') ?? requestUrl.searchParams.get('tenant')
  const explicitHostParam = requestUrl.searchParams.get('targetHost')
  const tenantSlug = sanitizeTenantSlug(tenantSlugParam)
  const explicitHost = sanitizeExplicitHost(explicitHostParam)

  requestUrl.searchParams.delete('tenant')
  requestUrl.searchParams.delete('tenantSlug')
  requestUrl.searchParams.delete('targetHost')

  if (tenantSlugParam && !tenantSlug) {
    return c.json({ error: 'invalid_tenant', message: 'Tenant slug is invalid.' }, 400)
  }

  if (explicitHostParam && !explicitHost) {
    return c.json({ error: 'invalid_host', message: 'Target host is invalid.' }, 400)
  }

  const targetHost = resolveTargetHost(gatewayConfig, { tenantSlug, explicitHost })
  if (!targetHost) {
    return c.json({ error: 'unresolvable_host', message: 'Unable to resolve target tenant host.' }, 400)
  }

  const location = buildForwardLocation({
    config: gatewayConfig,
    provider,
    host: targetHost,
    query: requestUrl.searchParams,
  })

  return c.redirect(location, 302)
})

app.route(gatewayConfig.callbackBasePath, callbackRouter)

app.notFound((c) =>
  c.json(
    {
      error: 'not_found',
      path: c.req.path,
    },
    404,
  ),
)

app.onError((err, c) => {
  console.error('[oauth-gateway] Unhandled error', err)
  return c.json({ error: 'internal_error', message: 'OAuth gateway encountered an unexpected error.' }, 500)
})

serve(
  {
    fetch: app.fetch,
    hostname: gatewayConfig.host,
    port: gatewayConfig.port,
  },
  (info) => {
    console.info(
      `[oauth-gateway] listening on http://${info.address}:${info.port} | forwarding to base domain ${gatewayConfig.baseDomain}`,
    )
  },
)
