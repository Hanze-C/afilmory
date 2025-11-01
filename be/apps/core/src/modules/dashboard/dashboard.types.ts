import type { photoAssets } from '@afilmory/db'

type PhotoAssetSyncStatus = (typeof photoAssets.$inferSelect)['syncStatus']

export interface DashboardStats {
  totalPhotos: number
  totalStorageBytes: number
  thisMonthUploads: number
  previousMonthUploads: number
  sync: {
    synced: number
    pending: number
    conflicts: number
  }
}

export interface DashboardRecentActivityItem {
  id: string
  photoId: string
  title: string
  description: string | null
  createdAt: string
  takenAt: string | null
  storageProvider: string
  size: number | null
  syncStatus: PhotoAssetSyncStatus
  tags: string[]
  previewUrl: string | null
}

export interface DashboardOverview {
  stats: DashboardStats
  recentActivity: DashboardRecentActivityItem[]
}
