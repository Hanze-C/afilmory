import type { Buffer } from 'node:buffer'

export const THUMBNAIL_PLUGIN_DATA_KEY = 'afilmory:thumbnail-storage:data'

export interface ThumbnailPluginData {
  photoId: string
  fileName: string
  buffer: Buffer | null
  localUrl: string | null
}
