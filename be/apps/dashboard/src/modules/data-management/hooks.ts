import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ROUTE_PATHS } from '~/constants/routes'
import { getRequestErrorMessage } from '~/lib/errors'
import { AUTH_SESSION_QUERY_KEY } from '~/modules/auth/api/session'
import { signOutBySource } from '~/modules/auth/auth-client'
import { DASHBOARD_OVERVIEW_QUERY_KEY } from '~/modules/dashboard/hooks'
import { PHOTO_ASSET_LIST_QUERY_KEY, PHOTO_ASSET_SUMMARY_QUERY_KEY } from '~/modules/photos/hooks'

import { deleteTenantAccount, truncatePhotoAssetRecords } from './api'

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

export function useDeleteTenantAccountMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: deleteTenantAccount,
    onSuccess: async () => {
      toast.success('账户已删除', {
        description: '已清理当前租户下的全部数据，并登出所有成员。',
      })

      try {
        await signOutBySource()
      } catch (error) {
        console.error('Failed to sign out after account deletion', error)
      } finally {
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null)
        queryClient.clear()
        navigate(ROUTE_PATHS.TENANT_MISSING, { replace: true })
      }
    },
    onError: (error) => {
      const message = getRequestErrorMessage(error, '删除账户失败，请稍后再试。')
      toast.error('操作失败', { description: message })
    },
  })
}
