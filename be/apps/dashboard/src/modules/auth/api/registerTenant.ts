import type { FetchResponse } from 'ofetch'

import { coreApi } from '~/lib/api-client'

export interface RegisterTenantAccountPayload {
  email: string
  password: string
  name: string
}

export interface RegisterTenantPayload {
  account: RegisterTenantAccountPayload
  tenant: {
    name: string
    slug: string | null
  }
}

export type RegisterTenantResult = FetchResponse<unknown>

export async function registerTenant(payload: RegisterTenantPayload): Promise<RegisterTenantResult> {
  return await coreApi.raw('/auth/tenants/sign-up', {
    method: 'POST',
    body: payload,
  })
}
