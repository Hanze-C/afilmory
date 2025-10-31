import type {
  BuilderConfig,
  BuilderOptions,
  PhotoManifestItem,
  PhotoProcessingContext,
  PhotoProcessorOptions,
  StorageConfig,
  StorageObject,
} from '@afilmory/builder'
import {
  AfilmoryBuilder,
  processPhotoWithPipeline,
  THUMBNAIL_PLUGIN_SYMBOL,
  thumbnailStoragePlugin,
} from '@afilmory/builder'
import type { Logger as BuilderLogger } from '@afilmory/builder/logger/index.js'
import type { PhotoProcessingLoggers } from '@afilmory/builder/photo/index.js'
import { createPhotoProcessingLoggers, setGlobalLoggers } from '@afilmory/builder/photo/index.js'
import type { _Object } from '@aws-sdk/client-s3'
import { injectable } from 'tsyringe'

import { logger as coreLogger } from '../../helpers/logger.helper'
import { createBuilderLoggerAdapter } from './builder-logger.adapter'

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
  builderConfig?: BuilderConfig
}

@injectable()
export class PhotoBuilderService {
  private readonly baseLogger = coreLogger.extend('PhotoBuilder')
  private readonly builderLogger: BuilderLogger = createBuilderLoggerAdapter(this.baseLogger)
  private photoLoggers: PhotoProcessingLoggers | null = null

  createBuilder(config: BuilderConfig): AfilmoryBuilder {
    const enhancedConfig = this.ensureThumbnailPlugin(config)
    return new AfilmoryBuilder(enhancedConfig)
  }

  applyStorageConfig(builder: AfilmoryBuilder, config: StorageConfig): void {
    builder.getStorageManager().switchProvider(config)
  }

  async processPhotoFromStorageObject(
    object: StorageObject,
    options?: ProcessPhotoOptions,
  ): Promise<Awaited<ReturnType<typeof processPhotoWithPipeline>>> {
    const { existingItem, livePhotoMap, processorOptions, builder, builderConfig } = options ?? {}
    this.ensureGlobalPhotoLoggers()
    const activeBuilder = this.resolveBuilder(builder, builderConfig)
    await activeBuilder.ensurePluginsReady()

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
      pluginData: {},
    }

    return await processPhotoWithPipeline(
      context,
      activeBuilder,
      this.createPluginRuntime(activeBuilder, mergedOptions, builderConfig),
    )
  }

  private ensureGlobalPhotoLoggers(): void {
    if (!this.photoLoggers) {
      this.photoLoggers = createPhotoProcessingLoggers(0, this.builderLogger)
    }

    setGlobalLoggers(this.photoLoggers)
  }

  private resolveBuilder(builder?: AfilmoryBuilder, builderConfig?: BuilderConfig): AfilmoryBuilder {
    if (builder) {
      return builder
    }

    if (builderConfig) {
      return this.createBuilder(builderConfig)
    }

    throw new Error(
      'PhotoBuilderService requires a builder instance or configuration. Pass builder or builderConfig in ProcessPhotoOptions.',
    )
  }

  private createPluginRuntime(
    builder: AfilmoryBuilder,
    processorOptions: PhotoProcessorOptions,
    builderConfig?: BuilderConfig,
  ): { runState: ReturnType<AfilmoryBuilder['createPluginRunState']>; builderOptions: BuilderOptions } {
    const config = builderConfig ?? builder.getConfig()

    const builderOptions: BuilderOptions = {
      isForceMode: processorOptions.isForceMode,
      isForceManifest: processorOptions.isForceManifest,
      isForceThumbnails: processorOptions.isForceThumbnails,
      concurrencyLimit: config.options.defaultConcurrency,
    }

    return {
      runState: builder.createPluginRunState(),
      builderOptions,
    }
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

  private ensureThumbnailPlugin(config: BuilderConfig): BuilderConfig {
    const existingPlugins = config.plugins ?? []
    const hasPlugin = existingPlugins.some((entry) => {
      // Check for the unique Symbol identifier for reliable detection
      if (typeof entry === 'object' && entry !== null && THUMBNAIL_PLUGIN_SYMBOL in entry) {
        return true
      }
      // Fallback: check by name property for backward compatibility
      return entry?.name === 'afilmory:thumbnail-storage'
    })

    if (hasPlugin) {
      return config
    }

    return {
      ...config,
      plugins: [...existingPlugins, thumbnailStoragePlugin()],
    }
  }
}
