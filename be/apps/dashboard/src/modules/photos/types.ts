export type PhotoSyncActionType = 'insert' | 'update' | 'delete' | 'conflict' | 'noop'

export type PhotoSyncResolution = 'prefer-storage' | 'prefer-database' | undefined

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
