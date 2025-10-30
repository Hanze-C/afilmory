import { coreApi } from '~/lib/api-client'
import { camelCaseKeys } from '~/lib/case'

import type {
  PhotoAssetListItem,
  PhotoAssetSummary,
  PhotoSyncResult,
  RunPhotoSyncPayload,
} from './types'

export const runPhotoSync = async (
  payload: RunPhotoSyncPayload,
): Promise<PhotoSyncResult> => {
  const result = await coreApi<PhotoSyncResult>('/data-sync/run', {
    method: 'POST',
    body: { dryRun: payload.dryRun ?? false },
  })

  return camelCaseKeys<PhotoSyncResult>(result)
}

export const listPhotoAssets = async (): Promise<PhotoAssetListItem[]> => {
  const assets = await coreApi<PhotoAssetListItem[]>('/photos/assets')

  return camelCaseKeys<PhotoAssetListItem[]>(assets)
}

export const getPhotoAssetSummary = async (): Promise<PhotoAssetSummary> => {
  const summary = await coreApi<PhotoAssetSummary>('/photos/assets/summary')

  return camelCaseKeys<PhotoAssetSummary>(summary)
}

export const deletePhotoAssets = async (ids: string[]): Promise<void> => {
  await coreApi('/photos/assets/delete', {
    method: 'POST',
    body: { ids },
  })
}

export const uploadPhotoAssets = async (
  files: File[],
  options?: { directory?: string },
): Promise<PhotoAssetListItem[]> => {
  const formData = new FormData()

  if (options?.directory) {
    formData.append('directory', options.directory)
  }

  for (const file of files) {
    formData.append('files', file)
  }

  const response = await coreApi<{ assets: PhotoAssetListItem[] }>(
    '/photos/assets/upload',
    {
      method: 'POST',
      body: formData,
    },
  )

  const data = camelCaseKeys<{ assets: PhotoAssetListItem[] }>(response)

  return data.assets
}

export const getPhotoStorageUrl = async (
  storageKey: string,
): Promise<string> => {
  const result = await coreApi<{ url: string }>('/photos/storage-url', {
    method: 'GET',
    query: { key: storageKey },
  })

  const data = camelCaseKeys<{ url: string }>(result)

  return data.url
}
