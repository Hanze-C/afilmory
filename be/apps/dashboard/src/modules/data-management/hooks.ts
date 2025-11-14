import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getRequestErrorMessage } from '~/lib/errors'
import { DASHBOARD_OVERVIEW_QUERY_KEY } from '~/modules/dashboard/hooks'
import { PHOTO_ASSET_LIST_QUERY_KEY, PHOTO_ASSET_SUMMARY_QUERY_KEY } from '~/modules/photos/hooks'

import { truncatePhotoAssetRecords } from './api'

export function useTruncatePhotoAssetsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: truncatePhotoAssetRecords,
    onSuccess: async (result) => {
      toast.success('数据库记录已清空', {
        description: result.deleted > 0 ? `已标记删除 ${result.deleted} 条照片记录。` : '没有可清理的数据表记录。',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PHOTO_ASSET_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PHOTO_ASSET_SUMMARY_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_OVERVIEW_QUERY_KEY }),
      ])
    },
    onError: (error) => {
      const message = getRequestErrorMessage(error, '无法清空数据库记录，请稍后再试。')
      toast.error('清理失败', { description: message })
    },
  })
}
