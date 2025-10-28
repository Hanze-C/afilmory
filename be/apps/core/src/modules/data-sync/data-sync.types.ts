import type { BuilderConfig, StorageConfig } from '@afilmory/builder'
import type { PhotoAssetConflictPayload, PhotoAssetManifest } from '@afilmory/db'

export enum ConflictResolutionStrategy {
  PREFER_STORAGE = 'prefer-storage',
  PREFER_DATABASE = 'prefer-database',
}

export type DataSyncActionType = 'insert' | 'update' | 'delete' | 'conflict' | 'noop'

export interface SyncObjectSnapshot {
  size: number | null
  etag: string | null
  lastModified: string | null
  metadataHash: string | null
}

export type ConflictType = PhotoAssetConflictPayload['type']

export interface ConflictPayload extends Omit<PhotoAssetConflictPayload, 'storageSnapshot' | 'recordSnapshot'> {
  storageSnapshot?: SyncObjectSnapshot | null
  recordSnapshot?: SyncObjectSnapshot | null
}

export interface DataSyncAction {
  type: DataSyncActionType
  storageKey: string
  photoId: string | null
  applied: boolean
  resolution?: ConflictResolutionStrategy
  reason?: string
  snapshots?: {
    before?: SyncObjectSnapshot | null
    after?: SyncObjectSnapshot | null
  }
}

export interface DataSyncResultSummary {
  storageObjects: number
  databaseRecords: number
  inserted: number
  updated: number
  deleted: number
  conflicts: number
  skipped: number
}

export interface DataSyncResult {
  summary: DataSyncResultSummary
  actions: DataSyncAction[]
}

export interface DataSyncOptions {
  builderConfig: BuilderConfig
  storageConfig?: StorageConfig
  dryRun: boolean
}

export interface DataSyncConflict {
  id: string
  storageKey: string
  photoId: string | null
  reason: string | null
  payload: ConflictPayload | null
  manifestVersion: string
  manifest: PhotoAssetManifest
  storageProvider: string
  syncedAt: string
  updatedAt: string
}

export interface ResolveConflictOptions {
  strategy: ConflictResolutionStrategy
  builderConfig?: BuilderConfig
  storageConfig?: StorageConfig
  dryRun?: boolean
}
