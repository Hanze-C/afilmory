import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deletePhotoAssets,
  getPhotoAssetSummary,
  listPhotoAssets,
  uploadPhotoAssets,
} from './api'
import type { PhotoAssetListItem } from './types'

export const PHOTO_ASSET_SUMMARY_QUERY_KEY = [
  'photo-assets',
  'summary',
] as const
export const PHOTO_ASSET_LIST_QUERY_KEY = ['photo-assets', 'list'] as const

export const usePhotoAssetSummaryQuery = () => {
  return useQuery({
    queryKey: PHOTO_ASSET_SUMMARY_QUERY_KEY,
    queryFn: getPhotoAssetSummary,
  })
}

export const usePhotoAssetListQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: PHOTO_ASSET_LIST_QUERY_KEY,
    queryFn: listPhotoAssets,
    enabled: options?.enabled ?? true,
  })
}

export const useDeletePhotoAssetsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await deletePhotoAssets(ids)
    },
    onSuccess: (_, ids) => {
      void queryClient.invalidateQueries({
        queryKey: PHOTO_ASSET_LIST_QUERY_KEY,
      })
      void queryClient.invalidateQueries({
        queryKey: PHOTO_ASSET_SUMMARY_QUERY_KEY,
      })
      // Optimistically remove deleted ids from cache if available
      queryClient.setQueryData<PhotoAssetListItem[] | undefined>(
        PHOTO_ASSET_LIST_QUERY_KEY,
        (previous) => {
          if (!previous) return previous
          const idSet = new Set(ids)
          return previous.filter((item) => !idSet.has(item.id))
        },
      )
    },
  })
}

export const useUploadPhotoAssetsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: File[]) => {
      return await uploadPhotoAssets(files)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PHOTO_ASSET_LIST_QUERY_KEY,
      })
      void queryClient.invalidateQueries({
        queryKey: PHOTO_ASSET_SUMMARY_QUERY_KEY,
      })
    },
  })
}
