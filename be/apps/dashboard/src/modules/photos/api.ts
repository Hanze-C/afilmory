import { coreApi } from '~/lib/api-client'

import type { PhotoSyncResult, RunPhotoSyncPayload } from './types'

export const runPhotoSync = async (payload: RunPhotoSyncPayload): Promise<PhotoSyncResult> => {
  return await coreApi<PhotoSyncResult>('/data-sync/run', {
    method: 'POST',
    body: { dryRun: payload.dryRun ?? false },
  })
}
