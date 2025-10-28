import type { PhotoManifestItem, StorageConfig, StorageManager, StorageObject } from '@afilmory/builder'
import type { PhotoAssetConflictPayload, PhotoAssetConflictSnapshot, PhotoAssetManifest } from '@afilmory/db'
import { CURRENT_PHOTO_MANIFEST_VERSION, photoAssets } from '@afilmory/db'
import { BizException, ErrorCode } from 'core/errors'
import { PhotoBuilderService } from 'core/modules/photo/photo.service'
import { and, eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import { DbAccessor } from '../../database/database.provider'
import { requireTenantContext } from '../tenant/tenant.context'
import type {
  ConflictPayload,
  DataSyncAction,
  DataSyncConflict,
  DataSyncOptions,
  DataSyncResult,
  ResolveConflictOptions,
  SyncObjectSnapshot,
} from './data-sync.types'
import { ConflictResolutionStrategy } from './data-sync.types'

const DATABASE_ONLY_PROVIDER = 'database-only'

type PhotoAssetRecord = typeof photoAssets.$inferSelect
type PhotoAssetInsert = typeof photoAssets.$inferInsert

type ConflictCandidate = {
  record: PhotoAssetRecord
  storageObject: StorageObject
  storageSnapshot: SyncObjectSnapshot
  recordSnapshot: SyncObjectSnapshot
}

type StatusReconciliationEntry = {
  record: PhotoAssetRecord
  storageSnapshot: SyncObjectSnapshot
}

interface SyncPreparation {
  tenantId: string
  builder: ReturnType<PhotoBuilderService['createBuilder']>
  storageManager: StorageManager
  effectiveStorageConfig: StorageConfig
  storageObjects: StorageObject[]
  records: PhotoAssetRecord[]
  storageByKey: Map<string, StorageObject>
  recordByKey: Map<string, PhotoAssetRecord>
  missingInDb: StorageObject[]
  orphanInDb: PhotoAssetRecord[]
  conflictCandidates: ConflictCandidate[]
  statusReconciliation: StatusReconciliationEntry[]
  db: ReturnType<DbAccessor['get']>
  livePhotoMap?: Map<string, StorageObject>
}

@injectable()
export class DataSyncService {
  constructor(
    private readonly dbAccessor: DbAccessor,
    private readonly photoBuilderService: PhotoBuilderService,
  ) {}

  async runSync(options: DataSyncOptions): Promise<DataSyncResult> {
    const tenant = requireTenantContext()
    const context = await this.prepareSyncContext(tenant.tenant.id, options)
    const summary = this.createSummary(context)
    const actions: DataSyncAction[] = []

    await this.handleNewStorageObjects(context, summary, actions, options.dryRun)
    await this.handleOrphanRecords(context, summary, actions, options.dryRun)
    await this.handleMetadataConflicts(context, summary, actions, options.dryRun)
    await this.handleStatusReconciliation(context, summary, actions, options.dryRun)

    return {
      summary,
      actions,
    }
  }

  async listConflicts(): Promise<DataSyncConflict[]> {
    const tenant = requireTenantContext()
    const db = this.dbAccessor.get()

    const records = await db
      .select()
      .from(photoAssets)
      .where(and(eq(photoAssets.tenantId, tenant.tenant.id), eq(photoAssets.syncStatus, 'conflict')))

    return records.map((record) => this.mapRecordToConflict(record))
  }

  async resolveConflict(id: string, options: ResolveConflictOptions): Promise<DataSyncAction> {
    const tenant = requireTenantContext()
    const db = this.dbAccessor.get()

    const [record] = await db
      .select()
      .from(photoAssets)
      .where(and(eq(photoAssets.id, id), eq(photoAssets.tenantId, tenant.tenant.id)))
      .limit(1)

    if (!record) {
      throw new BizException(ErrorCode.COMMON_NOT_FOUND, { message: 'Conflict record not found.' })
    }

    if (record.syncStatus !== 'conflict') {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: 'Target record is not in conflict state.' })
    }

    const { conflictPayload } = record
    if (!conflictPayload) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: 'Missing conflict payload on record.' })
    }

    const dryRun = options.dryRun ?? false

    if (options.strategy === ConflictResolutionStrategy.PREFER_STORAGE) {
      return await this.resolveByStorage(record, conflictPayload, options, dryRun, tenant.tenant.id, db)
    }

    return await this.resolveByDatabase(record, conflictPayload, dryRun, tenant.tenant.id, db)
  }

  private async prepareSyncContext(tenantId: string, options: DataSyncOptions): Promise<SyncPreparation> {
    const builder = this.photoBuilderService.createBuilder(options.builderConfig)
    const effectiveStorageConfig = options.storageConfig ?? options.builderConfig.storage
    if (options.storageConfig) {
      this.photoBuilderService.applyStorageConfig(builder, options.storageConfig)
    }

    const storageManager = builder.getStorageManager()
    const storageObjects = await storageManager.listImages()
    const db = this.dbAccessor.get()
    const records = await db.select().from(photoAssets).where(eq(photoAssets.tenantId, tenantId))

    const storageByKey = new Map(storageObjects.map((object) => [object.key, object]))
    const recordByKey = new Map(records.map((record) => [record.storageKey, record]))

    const missingInDb = storageObjects.filter((object) => !recordByKey.has(object.key))
    const orphanInDb = records.filter(
      (record) => record.storageProvider !== DATABASE_ONLY_PROVIDER && !storageByKey.has(record.storageKey),
    )

    const conflictCandidates: ConflictCandidate[] = []
    const statusReconciliation: StatusReconciliationEntry[] = []

    for (const [storageKey, record] of recordByKey) {
      const storageObject = storageByKey.get(storageKey)
      if (!storageObject) {
        continue
      }

      const storageSnapshot = this.createStorageSnapshot(storageObject)
      const recordSnapshot = this.createRecordSnapshot(record)

      if (storageSnapshot.metadataHash !== recordSnapshot.metadataHash) {
        conflictCandidates.push({ record, storageObject, storageSnapshot, recordSnapshot })
        continue
      }

      if (record.syncStatus !== 'synced') {
        statusReconciliation.push({ record, storageSnapshot })
      }
    }

    return {
      tenantId,
      builder,
      storageManager,
      effectiveStorageConfig,
      storageObjects,
      records,
      storageByKey,
      recordByKey,
      missingInDb,
      orphanInDb,
      conflictCandidates,
      statusReconciliation,
      db,
    }
  }

  private createSummary(context: SyncPreparation): DataSyncResult['summary'] {
    return {
      storageObjects: context.storageObjects.length,
      databaseRecords: context.records.length,
      inserted: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      skipped: 0,
    }
  }

  private async handleNewStorageObjects(
    context: SyncPreparation,
    summary: DataSyncResult['summary'],
    actions: DataSyncAction[],
    dryRun: boolean,
  ): Promise<void> {
    if (context.missingInDb.length === 0) {
      return
    }

    const livePhotoMap = await this.ensureLivePhotoMap(context, dryRun)
    const { db, tenantId, effectiveStorageConfig, builder } = context

    for (const storageObject of context.missingInDb) {
      const storageSnapshot = this.createStorageSnapshot(storageObject)

      if (dryRun) {
        summary.inserted += 1
        actions.push({
          type: 'insert',
          storageKey: storageObject.key,
          photoId: null,
          applied: false,
          reason: 'Preview - new storage object would be imported.',
          snapshots: {
            after: storageSnapshot,
          },
        })
        continue
      }

      const result = await this.safeProcessStorageObject(storageObject, builder, {
        livePhotoMap,
      })

      if (!result?.item) {
        summary.conflicts += 1
        actions.push({
          type: 'conflict',
          storageKey: storageObject.key,
          photoId: null,
          applied: false,
          reason: 'Failed to generate manifest for new storage object.',
          snapshots: {
            after: storageSnapshot,
          },
        })
        continue
      }

      summary.inserted += 1
      const manifestPayload = this.createManifestPayload(result.item)
      const { metadataHash } = storageSnapshot
      const now = this.nowIso()

      await db
        .insert(photoAssets)
        .values(
          this.buildInsertPayload({
            tenantId,
            storageObject,
            manifest: manifestPayload,
            metadataHash,
            storageProvider: effectiveStorageConfig.provider,
            photoId: result.item.id,
            syncedAt: now,
          }),
        )
        .onConflictDoUpdate({
          target: [photoAssets.tenantId, photoAssets.storageKey],
          set: {
            photoId: result.item.id,
            storageProvider: effectiveStorageConfig.provider,
            size: storageSnapshot.size,
            etag: storageSnapshot.etag,
            lastModified: storageSnapshot.lastModified,
            metadataHash,
            manifestVersion: CURRENT_PHOTO_MANIFEST_VERSION,
            manifest: manifestPayload,
            syncStatus: 'synced',
            conflictReason: null,
            conflictPayload: null,
            syncedAt: now,
            updatedAt: now,
          },
        })

      actions.push({
        type: 'insert',
        storageKey: storageObject.key,
        photoId: result.item.id,
        applied: true,
        snapshots: {
          after: storageSnapshot,
        },
      })
    }
  }

  private async handleOrphanRecords(
    context: SyncPreparation,
    summary: DataSyncResult['summary'],
    actions: DataSyncAction[],
    dryRun: boolean,
  ): Promise<void> {
    if (context.orphanInDb.length === 0) {
      return
    }

    const { db, tenantId } = context

    for (const record of context.orphanInDb) {
      const recordSnapshot = this.createRecordSnapshot(record)
      summary.conflicts += 1

      const conflictPayload = this.createConflictPayload('missing-in-storage', {
        recordSnapshot,
      })

      if (!dryRun) {
        const now = this.nowIso()
        await db
          .update(photoAssets)
          .set({
            syncStatus: 'conflict',
            conflictReason: 'Storage object missing in provider.',
            conflictPayload,
            syncedAt: now,
            updatedAt: now,
          })
          .where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))
      }

      actions.push({
        type: 'conflict',
        storageKey: record.storageKey,
        photoId: record.photoId,
        applied: !dryRun,
        reason: 'Storage object missing in provider.',
        snapshots: {
          before: recordSnapshot,
        },
      })
    }
  }

  private async handleMetadataConflicts(
    context: SyncPreparation,
    summary: DataSyncResult['summary'],
    actions: DataSyncAction[],
    dryRun: boolean,
  ): Promise<void> {
    if (context.conflictCandidates.length === 0) {
      return
    }

    const { db, tenantId } = context

    for (const candidate of context.conflictCandidates) {
      const { record, storageObject, storageSnapshot, recordSnapshot } = candidate
      summary.conflicts += 1

      const conflictPayload = this.createConflictPayload('metadata-mismatch', {
        storageSnapshot,
        recordSnapshot,
      })

      if (!dryRun) {
        const now = this.nowIso()
        await db
          .update(photoAssets)
          .set({
            syncStatus: 'conflict',
            conflictReason: 'Storage metadata differs from database manifest.',
            conflictPayload,
            syncedAt: now,
            updatedAt: now,
          })
          .where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))
      }

      actions.push({
        type: 'conflict',
        storageKey: storageObject.key,
        photoId: record.photoId,
        applied: !dryRun,
        reason: 'Storage metadata differs from database manifest.',
        snapshots: {
          before: recordSnapshot,
          after: storageSnapshot,
        },
      })
    }
  }

  private async handleStatusReconciliation(
    context: SyncPreparation,
    summary: DataSyncResult['summary'],
    actions: DataSyncAction[],
    dryRun: boolean,
  ): Promise<void> {
    if (context.statusReconciliation.length === 0) {
      return
    }

    const { db, tenantId } = context

    for (const entry of context.statusReconciliation) {
      const { record, storageSnapshot } = entry
      summary.updated += 1

      if (!dryRun) {
        const now = this.nowIso()
        await db
          .update(photoAssets)
          .set({
            size: storageSnapshot.size,
            etag: storageSnapshot.etag,
            lastModified: storageSnapshot.lastModified,
            metadataHash: storageSnapshot.metadataHash,
            syncStatus: 'synced',
            conflictReason: null,
            conflictPayload: null,
            syncedAt: now,
            updatedAt: now,
          })
          .where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))
      }

      actions.push({
        type: 'update',
        storageKey: record.storageKey,
        photoId: record.photoId,
        applied: !dryRun,
        reason: 'Marked as synced to reflect matching metadata.',
        snapshots: {
          before: this.createRecordSnapshot(record),
          after: storageSnapshot,
        },
      })
    }
  }

  private async ensureLivePhotoMap(
    context: SyncPreparation,
    dryRun: boolean,
  ): Promise<Map<string, StorageObject> | undefined> {
    if (dryRun || context.missingInDb.length === 0) {
      return undefined
    }

    if (context.livePhotoMap) {
      return context.livePhotoMap
    }

    const allObjects = await context.storageManager.listAllFiles()
    context.livePhotoMap = await context.storageManager.detectLivePhotos(allObjects)
    return context.livePhotoMap
  }

  private buildInsertPayload(payload: {
    tenantId: string
    storageProvider: string
    storageObject: StorageObject
    manifest: PhotoAssetManifest
    metadataHash: string | null
    photoId: string
    syncedAt: string
  }): PhotoAssetInsert {
    const snapshot = this.createStorageSnapshot(payload.storageObject)
    const now = this.nowIso()
    return {
      tenantId: payload.tenantId,
      photoId: payload.photoId,
      storageKey: payload.storageObject.key,
      storageProvider: payload.storageProvider,
      size: snapshot.size,
      etag: snapshot.etag,
      lastModified: snapshot.lastModified,
      metadataHash: payload.metadataHash,
      manifestVersion: CURRENT_PHOTO_MANIFEST_VERSION,
      manifest: payload.manifest,
      syncStatus: 'synced',
      conflictReason: null,
      conflictPayload: null,
      syncedAt: payload.syncedAt,
      createdAt: now,
      updatedAt: now,
    }
  }

  private async safeProcessStorageObject(
    storageObject: StorageObject,
    builder: ReturnType<PhotoBuilderService['createBuilder']>,
    options: {
      existing?: PhotoManifestItem | null
      livePhotoMap?: Map<string, StorageObject>
    },
  ) {
    try {
      return await this.photoBuilderService.processPhotoFromStorageObject(storageObject, {
        existingItem: options.existing ?? undefined,
        livePhotoMap: options.livePhotoMap,
        processorOptions: {
          isForceMode: true,
          isForceManifest: true,
        },
        builder,
      })
    } catch {
      return null
    }
  }

  private createStorageSnapshot(object: StorageObject): SyncObjectSnapshot {
    const lastModified = this.toIso(object.lastModified)
    const metadataHash = this.computeMetadataHash({
      size: object.size ?? null,
      etag: object.etag ?? null,
      lastModified,
    })

    return {
      size: object.size ?? null,
      etag: object.etag ?? null,
      lastModified,
      metadataHash,
    }
  }

  private createRecordSnapshot(record: PhotoAssetRecord): SyncObjectSnapshot {
    const metadataHash =
      record.metadataHash ??
      this.computeMetadataHash({
        size: record.size ?? null,
        etag: record.etag ?? null,
        lastModified: record.lastModified ?? null,
      })

    return {
      size: record.size ?? null,
      etag: record.etag ?? null,
      lastModified: record.lastModified ?? null,
      metadataHash,
    }
  }

  private computeMetadataHash(parts: {
    size: number | null
    etag: string | null
    lastModified: string | null
  }): string | null {
    const normalizedSize = parts.size !== null ? String(parts.size) : ''
    const normalizedEtag = parts.etag ?? ''
    const normalizedLastModified = parts.lastModified ?? ''
    const digestValue = `${normalizedEtag}::${normalizedSize}::${normalizedLastModified}`
    return digestValue === '::::' ? null : digestValue
  }

  private createManifestPayload(item: PhotoManifestItem): PhotoAssetManifest {
    return {
      version: CURRENT_PHOTO_MANIFEST_VERSION,
      data: structuredClone(item),
    }
  }

  private mapRecordToConflict(record: PhotoAssetRecord): DataSyncConflict {
    return {
      id: record.id,
      storageKey: record.storageKey,
      photoId: record.photoId,
      reason: record.conflictReason ?? null,
      payload: this.mapConflictPayloadToResponse(record.conflictPayload),
      manifestVersion: record.manifestVersion,
      manifest: record.manifest,
      storageProvider: record.storageProvider,
      syncedAt: record.syncedAt,
      updatedAt: record.updatedAt,
    }
  }

  private mapConflictPayloadToResponse(payload: PhotoAssetConflictPayload | null): ConflictPayload | null {
    if (!payload) {
      return null
    }

    return {
      type: payload.type,
      storageSnapshot: this.fromConflictSnapshot(payload.storageSnapshot),
      recordSnapshot: this.fromConflictSnapshot(payload.recordSnapshot),
    }
  }

  private createConflictPayload(
    type: PhotoAssetConflictPayload['type'],
    payload: { storageSnapshot?: SyncObjectSnapshot | null; recordSnapshot?: SyncObjectSnapshot | null },
  ): PhotoAssetConflictPayload {
    return {
      type,
      storageSnapshot: this.toConflictSnapshot(payload.storageSnapshot ?? null),
      recordSnapshot: this.toConflictSnapshot(payload.recordSnapshot ?? null),
    }
  }

  private toConflictSnapshot(snapshot: SyncObjectSnapshot | null): PhotoAssetConflictSnapshot | null {
    if (!snapshot) {
      return null
    }

    return {
      size: snapshot.size,
      etag: snapshot.etag,
      lastModified: snapshot.lastModified,
      metadataHash: snapshot.metadataHash,
    }
  }

  private fromConflictSnapshot(snapshot: PhotoAssetConflictSnapshot | null | undefined): SyncObjectSnapshot | null {
    if (!snapshot) {
      return null
    }

    return {
      size: snapshot.size,
      etag: snapshot.etag,
      lastModified: snapshot.lastModified,
      metadataHash: snapshot.metadataHash,
    }
  }

  private nowIso(): string {
    return new Date().toISOString()
  }

  private toIso(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  }

  private async resolveByStorage(
    record: PhotoAssetRecord,
    payload: PhotoAssetConflictPayload,
    options: ResolveConflictOptions,
    dryRun: boolean,
    tenantId: string,
    db: ReturnType<DbAccessor['get']>,
  ): Promise<DataSyncAction> {
    if (!options.builderConfig) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: 'builderConfig is required to prefer storage.' })
    }

    const builder = this.photoBuilderService.createBuilder(options.builderConfig)
    const effectiveStorageConfig = options.storageConfig ?? options.builderConfig.storage
    if (options.storageConfig) {
      this.photoBuilderService.applyStorageConfig(builder, options.storageConfig)
    }

    const storageManager = builder.getStorageManager()

    if (payload.type === 'missing-in-storage') {
      if (dryRun) {
        return {
          type: 'delete',
          storageKey: record.storageKey,
          photoId: record.photoId,
          applied: false,
          resolution: ConflictResolutionStrategy.PREFER_STORAGE,
          reason: 'Preview - would remove database record to match storage.',
          snapshots: {
            before: this.createRecordSnapshot(record),
          },
        }
      }

      await db.delete(photoAssets).where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))

      return {
        type: 'delete',
        storageKey: record.storageKey,
        photoId: record.photoId,
        applied: true,
        resolution: ConflictResolutionStrategy.PREFER_STORAGE,
        reason: 'Removed database record to align with storage.',
        snapshots: {
          before: this.createRecordSnapshot(record),
        },
      }
    }

    const storageObjects = await storageManager.listImages()
    const storageObject = storageObjects.find((object) => object.key === record.storageKey)

    if (!storageObject) {
      throw new BizException(ErrorCode.COMMON_CONFLICT, {
        message: 'Storage object no longer exists; rerun data sync before resolving.',
      })
    }

    const processResult = await this.safeProcessStorageObject(storageObject, builder, {
      existing: record.manifest?.data as PhotoManifestItem | undefined,
    })
    if (!processResult?.item) {
      throw new BizException(ErrorCode.COMMON_CONFLICT, { message: 'Failed to reprocess storage object.' })
    }

    const storageSnapshot = this.createStorageSnapshot(storageObject)
    const manifestPayload = this.createManifestPayload(processResult.item)
    const now = this.nowIso()

    if (!dryRun) {
      await db
        .update(photoAssets)
        .set({
          photoId: processResult.item.id,
          storageProvider: effectiveStorageConfig.provider,
          size: storageSnapshot.size,
          etag: storageSnapshot.etag,
          lastModified: storageSnapshot.lastModified,
          metadataHash: storageSnapshot.metadataHash,
          manifestVersion: CURRENT_PHOTO_MANIFEST_VERSION,
          manifest: manifestPayload,
          syncStatus: 'synced',
          conflictReason: null,
          conflictPayload: null,
          syncedAt: now,
          updatedAt: now,
        })
        .where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))
    }

    return {
      type: 'update',
      storageKey: record.storageKey,
      photoId: processResult.item.id,
      applied: !dryRun,
      resolution: ConflictResolutionStrategy.PREFER_STORAGE,
      reason: 'Updated record using latest storage metadata.',
      snapshots: {
        before: this.createRecordSnapshot(record),
        after: storageSnapshot,
      },
    }
  }

  private async resolveByDatabase(
    record: PhotoAssetRecord,
    payload: PhotoAssetConflictPayload,
    dryRun: boolean,
    tenantId: string,
    db: ReturnType<DbAccessor['get']>,
  ): Promise<DataSyncAction> {
    const recordSnapshot = this.createRecordSnapshot(record)

    if (payload.type === 'missing-in-storage') {
      if (dryRun) {
        return {
          type: 'update',
          storageKey: record.storageKey,
          photoId: record.photoId,
          applied: false,
          resolution: ConflictResolutionStrategy.PREFER_DATABASE,
          reason: 'Preview - would retain database record despite missing storage.',
          snapshots: {
            before: recordSnapshot,
          },
        }
      }

      const now = this.nowIso()
      await db
        .update(photoAssets)
        .set({
          storageProvider: DATABASE_ONLY_PROVIDER,
          syncStatus: 'synced',
          conflictReason: null,
          conflictPayload: null,
          syncedAt: now,
          updatedAt: now,
        })
        .where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))

      return {
        type: 'update',
        storageKey: record.storageKey,
        photoId: record.photoId,
        applied: true,
        resolution: ConflictResolutionStrategy.PREFER_DATABASE,
        reason: 'Marked record as database-only after missing storage reconciliation.',
        snapshots: {
          before: recordSnapshot,
        },
      }
    }

    const storageSnapshot = this.fromConflictSnapshot(payload.storageSnapshot)
    if (!storageSnapshot) {
      throw new BizException(ErrorCode.COMMON_CONFLICT, {
        message: 'Missing storage snapshot to resolve metadata mismatch.',
      })
    }

    if (!dryRun) {
      const now = this.nowIso()
      await db
        .update(photoAssets)
        .set({
          size: storageSnapshot.size,
          etag: storageSnapshot.etag,
          lastModified: storageSnapshot.lastModified,
          metadataHash: storageSnapshot.metadataHash,
          syncStatus: 'synced',
          conflictReason: null,
          conflictPayload: null,
          syncedAt: now,
          updatedAt: now,
        })
        .where(and(eq(photoAssets.id, record.id), eq(photoAssets.tenantId, tenantId)))
    }

    return {
      type: 'update',
      storageKey: record.storageKey,
      photoId: record.photoId,
      applied: !dryRun,
      resolution: ConflictResolutionStrategy.PREFER_DATABASE,
      reason: 'Marked conflict as resolved in favor of database manifest.',
      snapshots: {
        before: recordSnapshot,
        after: storageSnapshot,
      },
    }
  }
}
