import type { _Object } from '@aws-sdk/client-s3'

import { logger } from '../logger/index.js'
import type { PhotoManifestItem, ProcessPhotoResult } from '../types/photo.js'
import type { PhotoProcessingContext } from './image-pipeline.js'
import { processPhotoWithPipeline } from './image-pipeline.js'
import { photoLoggers } from './logger-adapter.js'

export interface PhotoProcessorOptions {
  isForceMode: boolean
  isForceManifest: boolean
  isForceThumbnails: boolean
}

// 处理单张照片
export async function processPhoto(
  obj: _Object,
  index: number,
  workerId: number,
  totalImages: number,
  existingManifestMap: Map<string, PhotoManifestItem>,
  livePhotoMap: Map<string, _Object>,
  options: PhotoProcessorOptions,
): Promise<ProcessPhotoResult> {
  const key = obj.Key
  if (!key) {
    logger.image.warn(`跳过没有 Key 的对象`)
    return { item: null, type: 'failed' }
  }

  const existingItem = existingManifestMap.get(key)

  // 使用全局 logger（应在 init 阶段初始化）
  photoLoggers!.image.info(`📸 [${index + 1}/${totalImages}] ${key}`)

  // 构建处理上下文
  const context: PhotoProcessingContext = {
    photoKey: key,
    obj,
    existingItem,
    livePhotoMap,
    options,
  }

  // 使用处理管道
  return await processPhotoWithPipeline(context)
}
