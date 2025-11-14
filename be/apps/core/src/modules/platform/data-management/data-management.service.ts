import { photoAssets } from '@afilmory/db'
import { EventEmitterService } from '@afilmory/framework'
import { DbAccessor } from 'core/database/database.provider'
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
}
