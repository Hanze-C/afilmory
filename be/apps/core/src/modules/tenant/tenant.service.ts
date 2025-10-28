import { env } from '@afilmory/env'
import { createLogger } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'
import { injectable } from 'tsyringe'

import { TenantRepository } from './tenant.repository'
import type { TenantAggregate, TenantContext, TenantDomainMatch, TenantResolutionInput } from './tenant.types'

@injectable()
export class TenantService {
  private readonly defaultTenantSlug = env.DEFAULT_TENANT_SLUG
  private readonly logger = createLogger('TenantService')

  constructor(private readonly repository: TenantRepository) {}

  async createTenant(payload: {
    name: string
    slug: string
    domain?: string | null
    isPrimary?: boolean
  }): Promise<TenantAggregate> {
    return await this.repository.createTenant(payload)
  }

  async resolve(input: TenantResolutionInput): Promise<TenantContext> {
    const fallbackToDefault = input.fallbackToDefault ?? true
    const tenantId = this.normalizeString(input.tenantId)
    const slug = this.normalizeSlug(input.slug)
    const domain = this.normalizeDomain(input.domain)

    let aggregate: TenantAggregate | TenantDomainMatch | null = null

    if (tenantId) {
      aggregate = await this.repository.findById(tenantId)
    }

    if (!aggregate && slug) {
      aggregate = await this.repository.findBySlug(slug)
    }

    if (!aggregate && domain) {
      aggregate = await this.repository.findByDomain(domain)
    }

    if (!aggregate && fallbackToDefault) {
      aggregate = await this.repository.findPrimary()

      if (aggregate) {
        this.logger.warn('Tenant resolution fallback to primary tenant', {
          fallback: 'primary',
          requested: {
            tenantId: tenantId ?? undefined,
            slug: slug ?? undefined,
            domain: domain ?? undefined,
          },
          resolvedTenantId: aggregate.tenant.id,
          resolvedTenantSlug: aggregate.tenant.slug,
        })
      }
    }

    if (!aggregate && fallbackToDefault) {
      aggregate = await this.repository.findBySlug(this.defaultTenantSlug)

      if (aggregate) {
        this.logger.warn('Tenant resolution fallback to default tenant slug', {
          fallback: 'defaultSlug',
          requested: {
            tenantId: tenantId ?? undefined,
            slug: slug ?? undefined,
            domain: domain ?? undefined,
          },
          defaultTenantSlug: this.defaultTenantSlug,
          resolvedTenantId: aggregate.tenant.id,
        })
      }
    }

    if (!aggregate) {
      throw new BizException(ErrorCode.TENANT_NOT_FOUND)
    }

    this.ensureTenantIsActive(aggregate.tenant)

    const matchedDomain = this.extractMatchedDomain(aggregate)

    return {
      tenant: aggregate.tenant,
      domains: aggregate.domains,
      matchedDomain,
    }
  }

  async getById(id: string): Promise<TenantAggregate> {
    const aggregate = await this.repository.findById(id)
    if (!aggregate) {
      throw new BizException(ErrorCode.TENANT_NOT_FOUND)
    }
    this.ensureTenantIsActive(aggregate.tenant)
    return aggregate
  }

  async getBySlug(slug: string): Promise<TenantAggregate> {
    const normalized = this.normalizeSlug(slug)
    if (!normalized) {
      throw new BizException(ErrorCode.TENANT_NOT_FOUND)
    }

    const aggregate = await this.repository.findBySlug(normalized)
    if (!aggregate) {
      throw new BizException(ErrorCode.TENANT_NOT_FOUND)
    }
    this.ensureTenantIsActive(aggregate.tenant)
    return aggregate
  }

  async getDefaultTenant(): Promise<TenantAggregate> {
    return await this.getBySlug(this.defaultTenantSlug)
  }

  private ensureTenantIsActive(tenant: TenantAggregate['tenant']): void {
    if (tenant.status === 'suspended') {
      throw new BizException(ErrorCode.TENANT_SUSPENDED)
    }

    if (tenant.status !== 'active') {
      throw new BizException(ErrorCode.TENANT_INACTIVE)
    }
  }

  private normalizeString(value?: string | null): string | null {
    if (!value) {
      return null
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private normalizeSlug(value?: string | null): string | null {
    const normalized = this.normalizeString(value)
    return normalized ? normalized.toLowerCase() : null
  }

  private normalizeDomain(value?: string | null): string | null {
    const normalized = this.normalizeString(value)
    if (!normalized) {
      return null
    }

    return normalized.replace(/:\d+$/, '').toLowerCase()
  }

  private extractMatchedDomain(
    aggregate: TenantAggregate | TenantDomainMatch,
  ): TenantDomainMatch['matchedDomain'] | null {
    if ('matchedDomain' in aggregate && aggregate.matchedDomain) {
      return aggregate.matchedDomain
    }
    return null
  }
}
