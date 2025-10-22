import type {
  BuilderConfig,
  PhotoManifestItem,
  PhotoProcessingContext,
  PhotoProcessorOptions,
  StorageConfig,
  StorageObject,
  StorageProvider,
} from '@afilmory/builder'
import { AfilmoryBuilder, processPhotoWithPipeline, StorageFactory, StorageManager } from '@afilmory/builder'
import type { _Object } from '@aws-sdk/client-s3'
import { injectable } from 'tsyringe'

const DEFAULT_PROCESSOR_OPTIONS: PhotoProcessorOptions = {
  isForceMode: false,
  isForceManifest: false,
  isForceThumbnails: false,
}

export type ProcessPhotoOptions = {
  existingItem?: PhotoManifestItem
  livePhotoMap?: Map<string, StorageObject>
  processorOptions?: Partial<PhotoProcessorOptions>
  builder?: AfilmoryBuilder
}

@injectable()
export class PhotoBuilderService {
  private readonly defaultBuilder: AfilmoryBuilder

  constructor() {
    this.defaultBuilder = new AfilmoryBuilder()
  }

  getDefaultBuilder(): AfilmoryBuilder {
    return this.defaultBuilder
  }

  createBuilder(config?: Partial<BuilderConfig>): AfilmoryBuilder {
    return new AfilmoryBuilder(config)
  }

  createStorageManager(config: StorageConfig): StorageManager {
    return new StorageManager(config)
  }

  resolveStorageProvider(config: StorageConfig): StorageProvider {
    return StorageFactory.createProvider(config)
  }

  applyStorageConfig(builder: AfilmoryBuilder, config: StorageConfig): void {
    builder.getStorageManager().switchProvider(config)
  }

  async processPhotoFromStorageObject(
    object: StorageObject,
    options?: ProcessPhotoOptions,
  ): Promise<Awaited<ReturnType<typeof processPhotoWithPipeline>>> {
    const { existingItem, livePhotoMap, processorOptions, builder } = options ?? {}
    const activeBuilder = builder ?? this.defaultBuilder

    const mergedOptions: PhotoProcessorOptions = {
      ...DEFAULT_PROCESSOR_OPTIONS,
      ...processorOptions,
    }

    const context: PhotoProcessingContext = {
      photoKey: object.key,
      obj: this.toLegacyObject(object),
      existingItem,
      livePhotoMap: this.toLegacyLivePhotoMap(livePhotoMap),
      options: mergedOptions,
    }

    return await processPhotoWithPipeline(context, activeBuilder)
  }

  private toLegacyObject(object: StorageObject): _Object {
    return {
      Key: object.key,
      Size: object.size,
      LastModified: object.lastModified,
      ETag: object.etag,
    }
  }

  private toLegacyLivePhotoMap(livePhotoMap?: Map<string, StorageObject>): Map<string, _Object> {
    if (!livePhotoMap) {
      return new Map()
    }

    const result = new Map<string, _Object>()

    for (const [key, value] of livePhotoMap) {
      result.set(key, this.toLegacyObject(value))
    }

    return result
  }
}
