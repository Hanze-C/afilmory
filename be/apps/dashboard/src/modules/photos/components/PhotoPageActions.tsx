import type { ReactNode } from 'react'

import { MainPageLayout } from '~/components/layouts/MainPageLayout'

import type { PhotoSyncProgressEvent, PhotoSyncResult } from '../types'
import { PhotoLibraryActionBar } from './library/PhotoLibraryActionBar'
import type { PhotoPageTab } from './PhotoPage'
import { PhotoSyncActions } from './sync/PhotoSyncActions'

type PhotoPageActionsProps = {
  activeTab: PhotoPageTab
  selectionCount: number
  libraryTotalCount: number
  isUploading: boolean
  isDeleting: boolean
  onUpload: (files: FileList) => void | Promise<void>
  onDeleteSelected: () => void
  onClearSelection: () => void
  onSelectAll: () => void
  onSyncCompleted: (result: PhotoSyncResult, context: { dryRun: boolean }) => void
  onSyncProgress: (event: PhotoSyncProgressEvent) => void
  onSyncError: (error: Error) => void
}

export function PhotoPageActions({
  activeTab,
  selectionCount,
  libraryTotalCount,
  isUploading,
  isDeleting,
  onUpload,
  onDeleteSelected,
  onClearSelection,
  onSelectAll,
  onSyncCompleted,
  onSyncProgress,
  onSyncError,
}: PhotoPageActionsProps) {
  if (activeTab === 'storage') {
    return null
  }

  let actionContent: ReactNode | null = null

  switch (activeTab) {
    case 'sync': {
      actionContent = (
        <PhotoSyncActions onCompleted={onSyncCompleted} onProgress={onSyncProgress} onError={onSyncError} />
      )
      break
    }
    case 'library': {
      actionContent = (
        <PhotoLibraryActionBar
          selectionCount={selectionCount}
          totalCount={libraryTotalCount}
          isUploading={isUploading}
          isDeleting={isDeleting}
          onUpload={onUpload}
          onDeleteSelected={onDeleteSelected}
          onClearSelection={onClearSelection}
          onSelectAll={onSelectAll}
        />
      )
      break
    }
    default: {
      actionContent = null
    }
  }

  if (!actionContent) {
    return null
  }

  return <MainPageLayout.Actions>{actionContent}</MainPageLayout.Actions>
}
