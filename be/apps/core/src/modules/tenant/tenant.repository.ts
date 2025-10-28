import { generateId, tenantDomains, tenants } from '@afilmory/db'
import { and, eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import { DbAccessor } from '../../database/database.provider'
import type { TenantAggregate, TenantDomainMatch } from './tenant.types'

@injectable()
export class TenantRepository {
  constructor(private readonly dbAccessor: DbAccessor) {}

  async findById(id: string): Promise<TenantAggregate | null> {
    const db = this.dbAccessor.get()
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1)
    if (!tenant) {
      return null
    }
    const domains = await db.select().from(tenantDomains).where(eq(tenantDomains.tenantId, tenant.id))
    return { tenant, domains }
  }

  async findBySlug(slug: string): Promise<TenantAggregate | null> {
    const db = this.dbAccessor.get()
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1)
    if (!tenant) {
      return null
    }
    const domains = await db.select().from(tenantDomains).where(eq(tenantDomains.tenantId, tenant.id))
    return { tenant, domains }
  }

  async findPrimary(): Promise<TenantAggregate | null> {
    const db = this.dbAccessor.get()
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.isPrimary, true), eq(tenants.status, 'active')))
      .limit(1)
    if (!tenant) {
      return null
    }
    const domains = await db.select().from(tenantDomains).where(eq(tenantDomains.tenantId, tenant.id))
    return { tenant, domains }
  }

  async findByDomain(domain: string): Promise<TenantDomainMatch | null> {
    const normalized = domain.trim().toLowerCase()
    if (!normalized) {
      return null
    }

    const db = this.dbAccessor.get()
    const [matchedDomain] = await db.select().from(tenantDomains).where(eq(tenantDomains.domain, normalized)).limit(1)

    if (!matchedDomain) {
      return null
    }

    const aggregate = await this.findById(matchedDomain.tenantId)
    if (!aggregate) {
      return null
    }

    return {
      ...aggregate,
      matchedDomain,
    }
  }

  async createTenant(payload: {
    name: string
    slug: string
    domain?: string | null
    isPrimary?: boolean
  }): Promise<TenantAggregate> {
    const db = this.dbAccessor.get()
    const tenantId = generateId()
    const tenantRecord: typeof tenants.$inferInsert = {
      id: tenantId,
      name: payload.name,
      slug: payload.slug,
      status: 'active',
      primaryDomain: payload.domain ?? null,
      isPrimary: payload.isPrimary ?? false,
    }

    if (tenantRecord.isPrimary) {
      await db
        .update(tenants)
        .set({ isPrimary: false })
        .where(and(eq(tenants.isPrimary, true), eq(tenants.status, 'active')))
    }

    await db.insert(tenants).values(tenantRecord)

    if (payload.domain) {
      const domainRecord: typeof tenantDomains.$inferInsert = {
        id: generateId(),
        tenantId,
        domain: payload.domain,
        isPrimary: true,
      }
      await db.insert(tenantDomains).values(domainRecord)
    }

    return await this.findById(tenantId).then((aggregate) => {
      if (!aggregate) {
        throw new Error('Failed to create tenant')
      }
      return aggregate
    })
  }
}
