import { useCallback,useMemo, useState  } from 'react'
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
import type {
  PhotoAssetListItem,
  PhotoSyncProgressEvent,
  PhotoSyncProgressStage,
  PhotoSyncProgressState,
  PhotoSyncResult,
} from '../types'
import { PhotoLibraryActionBar } from './library/PhotoLibraryActionBar'
import { PhotoLibraryGrid } from './library/PhotoLibraryGrid'
import { PhotoSyncActions } from './sync/PhotoSyncActions'
import { PhotoSyncProgressPanel } from './sync/PhotoSyncProgressPanel'
import { PhotoSyncResultPanel } from './sync/PhotoSyncResultPanel'

type PhotoPageTab = 'sync' | 'library'

const STAGE_ORDER: PhotoSyncProgressStage[] = [
  'missing-in-db',
  'orphan-in-db',
  'metadata-conflicts',
  'status-reconciliation',
]

const createInitialStages = (
  totals: PhotoSyncProgressState['totals'],
): PhotoSyncProgressState['stages'] =>
  STAGE_ORDER.reduce<PhotoSyncProgressState['stages']>(
    (acc, stage) => {
      const total = totals[stage]
      acc[stage] = {
        status: total === 0 ? 'completed' : 'pending',
        processed: 0,
        total,
      }
      return acc
    },
    {} as PhotoSyncProgressState['stages'],
  )

export const PhotoPage = () => {
  const [activeTab, setActiveTab] = useState<PhotoPageTab>('sync')
  const [result, setResult] = useState<PhotoSyncResult | null>(null)
  const [lastWasDryRun, setLastWasDryRun] = useState<boolean | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [syncProgress, setSyncProgress] =
    useState<PhotoSyncProgressState | null>(null)

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

  const handleProgressEvent = useCallback(
    (event: PhotoSyncProgressEvent) => {
      if (event.type === 'start') {
        const { summary, totals, options } = event.payload
        setSyncProgress({
          dryRun: options.dryRun,
          summary,
          totals,
          stages: createInitialStages(totals),
          startedAt: Date.now(),
          updatedAt: Date.now(),
          lastAction: undefined,
          error: undefined,
        })
        setResult(null)
        setLastWasDryRun(options.dryRun)
        return
      }

      if (event.type === 'complete') {
        setSyncProgress(null)
        return
      }

      if (event.type === 'error') {
        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                error: event.payload.message,
                updatedAt: Date.now(),
              }
            : prev,
        )
        return
      }

      if (event.type === 'stage') {
        setSyncProgress((prev) => {
          if (!prev) {
            return prev
          }

          const { stage, status, processed, total, summary } = event.payload
          const nextStages = {
            ...prev.stages,
            [stage]: {
              status:
                status === 'complete'
                  ? 'completed'
                  : total === 0
                    ? 'completed'
                    : 'running',
              processed,
              total,
            },
          }

          return {
            ...prev,
            summary,
            stages: nextStages,
            updatedAt: Date.now(),
          }
        })
        return
      }

      if (event.type === 'action') {
        setSyncProgress((prev) => {
          if (!prev) {
            return prev
          }

          const { stage, index, total, action, summary } = event.payload
          const nextStages = {
            ...prev.stages,
            [stage]: {
              status: total === 0 ? 'completed' : 'running',
              processed: index,
              total,
            },
          }

          return {
            ...prev,
            summary,
            stages: nextStages,
            lastAction: {
              stage,
              index,
              total,
              action,
            },
            updatedAt: Date.now(),
          }
        })
      }
    },
    [setResult, setLastWasDryRun],
  )

  const handleSyncError = useCallback((error: Error) => {
    setSyncProgress((prev) =>
      prev
        ? {
            ...prev,
            error: error.message,
            updatedAt: Date.now(),
          }
        : prev,
    )
  }, [])

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
              setSyncProgress(null)
              void summaryQuery.refetch()
              void listQuery.refetch()
            }}
            onProgress={handleProgressEvent}
            onError={handleSyncError}
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

        {activeTab === 'sync' && syncProgress ? (
          <PhotoSyncProgressPanel progress={syncProgress} />
        ) : null}

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
