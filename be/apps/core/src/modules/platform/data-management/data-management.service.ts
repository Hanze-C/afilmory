import {
  authSessions,
  authUsers,
  photoAssets,
  reactions,
  settings,
  tenantAuthAccounts,
  tenantAuthSessions,
  tenantAuthUsers,
  tenants,
} from '@afilmory/db'
import { EventEmitterService } from '@afilmory/framework'
import { DbAccessor } from 'core/database/database.provider'
import { BizException, ErrorCode } from 'core/errors'
import { PLACEHOLDER_TENANT_SLUG, ROOT_TENANT_SLUG } from 'core/modules/platform/tenant/tenant.constants'
import { requireTenantContext } from 'core/modules/platform/tenant/tenant.context'
import { eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

@injectable()
export class DataManagementService {
  constructor(
    private readonly dbAccessor: DbAccessor,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  async clearPhotoAssetRecords(): Promise<{ deleted: number }> {
    const tenant = requireTenantContext()
    const db = this.dbAccessor.get()

    const deletedRecords = await db
      .delete(photoAssets)
      .where(eq(photoAssets.tenantId, tenant.tenant.id))
      .returning({ id: photoAssets.id })

    if (deletedRecords.length > 0) {
      await this.eventEmitter.emit('photo.manifest.changed', { tenantId: tenant.tenant.id })
    }

    return {
      deleted: deletedRecords.length,
    }
  }

  async deleteTenantAccount(): Promise<{ deletedTenantId: string }> {
    const tenant = requireTenantContext()
    const tenantId = tenant.tenant.id
    const tenantSlug = tenant.tenant.slug

    if (!tenantSlug) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
        message: '当前租户缺少 slug，无法删除账户。',
      })
    }

    if (tenantSlug === ROOT_TENANT_SLUG || tenantSlug === PLACEHOLDER_TENANT_SLUG) {
      throw new BizException(ErrorCode.AUTH_FORBIDDEN, {
        message: '系统租户无法通过此操作删除。',
      })
    }

    const db = this.dbAccessor.get()

    await db.transaction(async (tx) => {
      await tx.delete(photoAssets).where(eq(photoAssets.tenantId, tenantId))
      await tx.delete(reactions).where(eq(reactions.tenantId, tenantId))
      await tx.delete(settings).where(eq(settings.tenantId, tenantId))
      await tx.delete(tenantAuthAccounts).where(eq(tenantAuthAccounts.tenantId, tenantId))
      await tx.delete(tenantAuthSessions).where(eq(tenantAuthSessions.tenantId, tenantId))
      await tx.delete(tenantAuthUsers).where(eq(tenantAuthUsers.tenantId, tenantId))
      await tx.delete(authSessions).where(eq(authSessions.tenantId, tenantId))
      await tx.update(authUsers).set({ tenantId: null, role: 'user' }).where(eq(authUsers.tenantId, tenantId))
      await tx.delete(tenants).where(eq(tenants.id, tenantId))
    })

    return {
      deletedTenantId: tenantId,
    }
  }
}
