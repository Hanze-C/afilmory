import { coreApi } from '~/lib/api-client'

type TruncatePhotoAssetsResponse = {
  deleted: number
}

type DeleteTenantAccountResponse = {
  deletedTenantId: string
}

export async function truncatePhotoAssetRecords() {
  return await coreApi<TruncatePhotoAssetsResponse>('/data-management/photo-assets/truncate', {
    method: 'POST',
  })
}

export async function deleteTenantAccount() {
  return await coreApi<DeleteTenantAccountResponse>('/data-management/account', {
    method: 'DELETE',
  })
}
