import type { PhotoManifestItem } from '@afilmory/builder'

export type PhotoSyncActionType =
  | 'insert'
  | 'update'
  | 'delete'
  | 'conflict'
  | 'noop'

export type PhotoSyncResolution =
  | 'prefer-storage'
  | 'prefer-database'
  | undefined

export interface PhotoSyncSnapshot {
  size: number | null
  etag: string | null
  lastModified: string | null
  metadataHash: string | null
}

export interface PhotoSyncAction {
  type: PhotoSyncActionType
  storageKey: string
  photoId: string | null
  applied: boolean
  resolution?: PhotoSyncResolution
  reason?: string
  snapshots?: {
    before?: PhotoSyncSnapshot | null
    after?: PhotoSyncSnapshot | null
  }
  manifestBefore?: PhotoManifestItem | null
  manifestAfter?: PhotoManifestItem | null
}

export interface PhotoSyncResultSummary {
  storageObjects: number
  databaseRecords: number
  inserted: number
  updated: number
  deleted: number
  conflicts: number
  skipped: number
}

export interface PhotoSyncResult {
  summary: PhotoSyncResultSummary
  actions: PhotoSyncAction[]
}

export interface RunPhotoSyncPayload {
  dryRun?: boolean
}

export interface PhotoAssetManifestPayload {
  version: string
  data: PhotoManifestItem
}

export interface PhotoAssetListItem {
  id: string
  photoId: string
  storageKey: string
  storageProvider: string
  manifest: PhotoAssetManifestPayload
  syncedAt: string
  updatedAt: string
  createdAt: string
  publicUrl: string | null
  size: number | null
  syncStatus: 'pending' | 'synced' | 'conflict'
}

export interface PhotoAssetSummary {
  total: number
  synced: number
  conflicts: number
  pending: number
}
