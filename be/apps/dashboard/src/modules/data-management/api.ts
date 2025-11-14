import { coreApi } from '~/lib/api-client'

type TruncatePhotoAssetsResponse = {
  deleted: number
}

export async function truncatePhotoAssetRecords() {
  return await coreApi<TruncatePhotoAssetsResponse>('/data-management/photo-assets/truncate', {
    method: 'POST',
  })
}
