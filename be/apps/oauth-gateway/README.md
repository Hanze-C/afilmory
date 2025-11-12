# OAuth Gateway

Multi-tenant OAuth callback router that lets every identity provider point to a single domain
(`auth.afilmory.art`, for example) while keeping the actual Better Auth handlers inside each tenant
subdomain.

## How It Works

1. Better Auth (running inside `be/apps/core`) builds provider redirect URLs using the tenant slug.
2. Instead of sending the provider back to the tenant domain, the redirect URL is set to
   `https://auth.afilmory.art/api/auth/callback/{provider}?tenantSlug=<slug>`.
3. The gateway receives the provider callback, validates the slug/host, and issues a 302 redirect to
   `https://<slug>.afilmory.art/api/auth/callback/{provider}` (preserving `code`, `state`, etc.).

Because the gateway only rewrites the callback target, it does **not** interact with provider APIs or
tokens. This keeps configuration simple (single callback URL in GitHub/Google) while ensuring tenant
sessions are still created on the correct host.

## Development

```bash
pnpm --filter @afilmory/oauth-gateway dev
```

The service starts on `http://0.0.0.0:8790` by default.

## Environment Variables

| Variable                          | Default              | Description                                                       |
| --------------------------------- | -------------------- | ----------------------------------------------------------------- |
| `AUTH_GATEWAY_HOST`               | `0.0.0.0`            | Interface to bind.                                                |
| `AUTH_GATEWAY_PORT`               | `8790`               | Port to listen on.                                                |
| `AUTH_GATEWAY_BASE_DOMAIN`        | `afilmory.art`       | Root domain used when constructing tenant hosts.                  |
| `AUTH_GATEWAY_CALLBACK_BASE_PATH` | `/api/auth/callback` | Base path that the providers call.                                |
| `AUTH_GATEWAY_FORCE_HTTPS`        | `true`               | Forces redirects to `https` unless the host looks like localhost. |
| `AUTH_GATEWAY_ALLOW_CUSTOM_HOST`  | `false`              | Allow requests to pass an explicit `targetHost` query parameter.  |
| `AUTH_GATEWAY_ROOT_SLUG`          | `root`               | Slug treated as the apex (no subdomain).                          |

## Callback Contract

`GET /api/auth/callback/:provider`

Query parameters:

- `tenantSlug` (preferred) or `tenant` — tenant slug to route to. Required unless `targetHost` is
  provided or you want to hit the root domain.
- `targetHost` — explicit host override (opt-in via `ALLOW_CUSTOM_HOST`).
- All other query parameters (`code`, `state`, etc.) are forwarded verbatim.

Example redirect produced by the gateway:

```
https://auth.afilmory.art/api/auth/callback/github?tenantSlug=innei&code=...&state=...
  ⮕ 302 → https://innei.afilmory.art/api/auth/callback/github?code=...&state=...
```

This service is intentionally stateless so it can be deployed behind a simple load balancer.
