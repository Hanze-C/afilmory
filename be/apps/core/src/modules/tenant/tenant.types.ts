import type { tenantDomains, tenants, tenantStatusEnum } from '@afilmory/db'

export type TenantRecord = typeof tenants.$inferSelect
export type TenantDomainRecord = typeof tenantDomains.$inferSelect
export type TenantStatus = (typeof tenantStatusEnum.enumValues)[number]

export interface TenantAggregate {
  tenant: TenantRecord
  domains: TenantDomainRecord[]
}

export interface TenantDomainMatch extends TenantAggregate {
  matchedDomain: TenantDomainRecord
}

export interface TenantContext extends TenantAggregate {
  matchedDomain?: TenantDomainRecord | null
}

export interface TenantResolutionInput {
  tenantId?: string | null
  slug?: string | null
  domain?: string | null
  fallbackToDefault?: boolean
}

export interface TenantCacheEntry {
  aggregate: TenantAggregate
  matchedDomain?: TenantDomainRecord | null
  cachedAt: number
}
