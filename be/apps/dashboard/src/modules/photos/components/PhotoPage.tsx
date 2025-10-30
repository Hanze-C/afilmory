import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { MainPageLayout } from '~/components/layouts/MainPageLayout'
import { PageTabs } from '~/components/navigation/PageTabs'

import { getPhotoStorageUrl } from '../api'
import {
  useDeletePhotoAssetsMutation,
  usePhotoAssetListQuery,
  usePhotoAssetSummaryQuery,
  useUploadPhotoAssetsMutation,
} from '../hooks'
import type { PhotoAssetListItem, PhotoSyncResult } from '../types'
import { PhotoLibraryActionBar } from './library/PhotoLibraryActionBar'
import { PhotoLibraryGrid } from './library/PhotoLibraryGrid'
import { PhotoSyncActions } from './sync/PhotoSyncActions'
import { PhotoSyncResultPanel } from './sync/PhotoSyncResultPanel'

type PhotoPageTab = 'sync' | 'library'

export const PhotoPage = () => {
  const [activeTab, setActiveTab] = useState<PhotoPageTab>('sync')
  const [result, setResult] = useState<PhotoSyncResult | null>(null)
  const [lastWasDryRun, setLastWasDryRun] = useState<boolean | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const summaryQuery = usePhotoAssetSummaryQuery()
  const listQuery = usePhotoAssetListQuery({ enabled: activeTab === 'library' })
  const deleteMutation = useDeletePhotoAssetsMutation()
  const uploadMutation = useUploadPhotoAssetsMutation()

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const isListLoading = listQuery.isLoading || listQuery.isFetching

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleDeleteAssets = async (ids: string[]) => {
    if (ids.length === 0) return
    try {
      await deleteMutation.mutateAsync(ids)
      toast.success(`已删除 ${ids.length} 个资源`)
      setSelectedIds((prev) => prev.filter((item) => !ids.includes(item)))
      void listQuery.refetch()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '删除失败，请稍后重试。'
      toast.error('删除失败', { description: message })
    }
  }

  const handleUploadAssets = async (files: FileList) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return
    try {
      await uploadMutation.mutateAsync(fileArray)
      toast.success(`成功上传 ${fileArray.length} 张图片`)
      void listQuery.refetch()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '上传失败，请稍后重试。'
      toast.error('上传失败', { description: message })
    }
  }

  const handleOpenAsset = async (asset: PhotoAssetListItem) => {
    const manifest = asset.manifest?.data
    const candidate =
      manifest?.originalUrl ?? manifest?.thumbnailUrl ?? asset.publicUrl
    if (candidate) {
      window.open(candidate, '_blank', 'noopener,noreferrer')
      return
    }

    try {
      const url = await getPhotoStorageUrl(asset.storageKey)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '无法获取原图链接'
      toast.error('打开失败', { description: message })
    }
  }

  const handleDeleteSingle = (asset: PhotoAssetListItem) => {
    void handleDeleteAssets([asset.id])
  }

  const handleTabChange = (tab: PhotoPageTab) => {
    setActiveTab(tab)
    if (tab === 'sync') {
      setSelectedIds([])
    }
  }

  return (
    <MainPageLayout
      title="照片库"
      description="在此同步和管理服务器中的照片资产。"
    >
      <MainPageLayout.Actions>
        {activeTab === 'sync' ? (
          <PhotoSyncActions
            onCompleted={(data, context) => {
              setResult(data)
              setLastWasDryRun(context.dryRun)
              void summaryQuery.refetch()
              void listQuery.refetch()
            }}
          />
        ) : (
          <PhotoLibraryActionBar
            selectionCount={selectedIds.length}
            isUploading={uploadMutation.isPending}
            isDeleting={deleteMutation.isPending}
            onUpload={handleUploadAssets}
            onDeleteSelected={() => {
              void handleDeleteAssets(selectedIds)
            }}
            onClearSelection={handleClearSelection}
          />
        )}
      </MainPageLayout.Actions>

      <div className="space-y-6">
        <PageTabs
          activeId={activeTab}
          onSelect={(id) => handleTabChange(id as PhotoPageTab)}
          items={[
            { id: 'sync', label: '同步结果' },
            { id: 'library', label: '图库管理' },
          ]}
        />

        {activeTab === 'sync' ? (
          <PhotoSyncResultPanel
            result={result}
            lastWasDryRun={lastWasDryRun}
            baselineSummary={summaryQuery.data}
            isSummaryLoading={summaryQuery.isLoading}
            onRequestStorageUrl={getPhotoStorageUrl}
          />
        ) : (
          <PhotoLibraryGrid
            assets={listQuery.data}
            isLoading={isListLoading}
            selectedIds={selectedSet}
            onToggleSelect={handleToggleSelect}
            onOpenAsset={handleOpenAsset}
            onDeleteAsset={handleDeleteSingle}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>
    </MainPageLayout>
  )
}
