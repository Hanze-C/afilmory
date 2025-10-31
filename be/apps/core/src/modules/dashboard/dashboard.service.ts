import { photoAssets } from '@afilmory/db'
import { desc, eq, sql } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import { DbAccessor } from '../../database/database.provider'
import { requireTenantContext } from '../tenant/tenant.context'
import type { DashboardOverview, DashboardRecentActivityItem } from './dashboard.types'

const ZERO_STATS = {
  totalPhotos: 0,
  totalStorageBytes: 0,
  thisMonthUploads: 0,
  previousMonthUploads: 0,
  sync: {
    synced: 0,
    pending: 0,
    conflicts: 0,
  },
} as const

@injectable()
export class DashboardService {
  constructor(private readonly dbAccessor: DbAccessor) {}

  async getOverview(): Promise<DashboardOverview> {
    const tenant = requireTenantContext()
    const db = this.dbAccessor.get()

    const [rawStats] = await db
      .select({
        totalPhotos: sql<number>`count(*)`,
        totalStorageBytes: sql<number>`coalesce(sum(${photoAssets.size}), 0)`,
        thisMonthUploads: sql<number>`count(*) filter (where date_trunc('month', ${photoAssets.createdAt}) = date_trunc('month', now()))`,
        previousMonthUploads: sql<number>`count(*) filter (where date_trunc('month', ${photoAssets.createdAt}) = date_trunc('month', now() - interval '1 month'))`,
        synced: sql<number>`count(*) filter (where ${photoAssets.syncStatus} = 'synced')`,
        pending: sql<number>`count(*) filter (where ${photoAssets.syncStatus} = 'pending')`,
        conflicts: sql<number>`count(*) filter (where ${photoAssets.syncStatus} = 'conflict')`,
      })
      .from(photoAssets)
      .where(eq(photoAssets.tenantId, tenant.tenant.id))

    const stats = rawStats
      ? {
          totalPhotos: Number(rawStats.totalPhotos ?? 0),
          totalStorageBytes: Number(rawStats.totalStorageBytes ?? 0),
          thisMonthUploads: Number(rawStats.thisMonthUploads ?? 0),
          previousMonthUploads: Number(rawStats.previousMonthUploads ?? 0),
          sync: {
            synced: Number(rawStats.synced ?? 0),
            pending: Number(rawStats.pending ?? 0),
            conflicts: Number(rawStats.conflicts ?? 0),
          },
        }
      : { ...ZERO_STATS }

    const recentRecords = await db
      .select({
        id: photoAssets.id,
        photoId: photoAssets.photoId,
        createdAt: photoAssets.createdAt,
        storageProvider: photoAssets.storageProvider,
        manifest: photoAssets.manifest,
        size: photoAssets.size,
        syncStatus: photoAssets.syncStatus,
      })
      .from(photoAssets)
      .where(eq(photoAssets.tenantId, tenant.tenant.id))
      .orderBy(desc(photoAssets.createdAt))
      .limit(8)

    const recentActivity: DashboardRecentActivityItem[] = recentRecords.map((record) => {
      const { manifest } = record
      const manifestData = manifest?.data
      const tags = manifestData?.tags?.slice(0, 5) ?? []

      return {
        id: record.id,
        photoId: record.photoId,
        title: manifestData?.title?.trim() || manifestData?.description?.trim() || record.photoId,
        description: manifestData?.description?.trim() || null,
        createdAt: record.createdAt,
        takenAt: manifestData?.dateTaken ?? null,
        storageProvider: record.storageProvider,
        size: record.size ?? null,
        syncStatus: record.syncStatus,
        tags,
        previewUrl: manifestData?.thumbnailUrl ?? manifestData?.originalUrl ?? null,
      }
    })

    return {
      stats,
      recentActivity,
    }
  }
}
