import { randomUUID } from 'node:crypto'

import type {
  BuilderConfig,
  PhotoManifestItem,
  StorageConfig,
  StorageManager,
  StorageObject,
  StorageProvider,
} from '@afilmory/builder'
import type { PhotoBuilderService } from 'core/modules/content/photo/builder/photo-builder.service'
import type { DataSyncLogPayload } from 'core/modules/infrastructure/data-sync/data-sync.types'

type BuilderDebugResultType = 'new' | 'processed' | 'skipped' | 'failed'
export type BuilderDebugProgressEvent =
  | {
      type: 'start'
      payload: {
        storageKey: string
        filename: string
        contentType: string | null
        size: number
      }
    }
  | {
      type: 'log'
      payload: DataSyncLogPayload
    }
  | {
      type: 'complete'
      payload: {
        storageKey: string
        resultType: BuilderDebugResultType
        manifestItem: PhotoManifestItem | null
        thumbnailUrl?: string | null
        filesDeleted: boolean
      }
    }
  | {
      type: 'error'
      payload: {
        message: string
      }
    }
export type UploadedDebugFile = {
  name: string
  size: number
  contentType: string | null
  buffer: Buffer
}
export type StorageResolution = {
  builder: ReturnType<PhotoBuilderService['createBuilder']>
  builderConfig: BuilderConfig
  storageConfig: StorageConfig
  storageManager: StorageManager
}
export class InMemoryDebugStorageProvider implements StorageProvider {
  private readonly files = new Map<
    string,
    {
      buffer: Buffer
      metadata: StorageObject
    }
  >()

  async getFile(key: string): Promise<Buffer | null> {
    return this.files.get(key)?.buffer ?? null
  }

  async listImages(): Promise<StorageObject[]> {
    return Array.from(this.files.values()).map((entry) => entry.metadata)
  }

  async listAllFiles(): Promise<StorageObject[]> {
    return this.listImages()
  }

  generatePublicUrl(key: string): string {
    return `debug://${encodeURIComponent(key)}`
  }

  detectLivePhotos(): Map<string, StorageObject> {
    return new Map()
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key)
  }

  async uploadFile(key: string, data: Buffer): Promise<StorageObject> {
    const normalizedKey = this.normalizeKey(key)
    const metadata: StorageObject = {
      key: normalizedKey,
      size: data.length,
      lastModified: new Date(),
      etag: randomUUID(),
    }

    this.files.set(normalizedKey, {
      buffer: data,
      metadata,
    })

    return metadata
  }

  private normalizeKey(key: string): string {
    return key.replaceAll('\\', '/').replaceAll(/^\/+|\/+$/g, '')
  }
}
