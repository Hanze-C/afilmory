import { Button, Modal } from '@afilmory/ui'
import { clsxm } from '@afilmory/utils'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { ChangeEventHandler } from 'react'
import { useRef } from 'react'

import { PhotoUploadConfirmModal } from './PhotoUploadConfirmModal'

type PhotoLibraryActionBarProps = {
  selectionCount: number
  totalCount: number
  isUploading: boolean
  isDeleting: boolean
  onUpload: (files: FileList) => void | Promise<void>
  onDeleteSelected: () => void
  onClearSelection: () => void
  onSelectAll: () => void
}

export function PhotoLibraryActionBar({
  selectionCount,
  totalCount,
  isUploading,
  isDeleting,
  onUpload,
  onDeleteSelected,
  onClearSelection,
  onSelectAll,
}: PhotoLibraryActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hasSelection = selectionCount > 0
  const hasAssets = totalCount > 0
  const canSelectAll = hasAssets && selectionCount < totalCount

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { files } = event.currentTarget
    if (!files || files.length === 0) return

    const selectedFiles = Array.from(files)

    Modal.present(PhotoUploadConfirmModal, {
      files: selectedFiles,
      onConfirm: (confirmedFiles) => {
        void onUpload(confirmedFiles)
      },
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex w-full relative  flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.heic,.HEIC,.heif,.HEIF,.hif,.HIF,.mov,.MOV"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isUploading}
          onClick={handleUploadClick}
          className="flex items-center gap-1"
        >
          <DynamicIcon name="upload" className="h-3.5 w-3.5" />
          上传文件
        </Button>
      </div>

      <div className="flex min-h-10 absolute right-0 translate-y-20 items-center justify-end gap-2">
        <div
          className={clsxm(
            'flex items-center gap-2 transition-opacity duration-200',
            hasSelection ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <span
            className={clsxm(
              'inline-flex items-center shape-squircle whitespace-nowrap px-2.5 py-1 text-xs font-medium',
              'bg-accent/10 text-accent',
            )}
          >
            已选 {selectionCount} 项
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={onDeleteSelected}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300"
          >
            <DynamicIcon name="trash-2" className="h-3.5 w-3.5" />
            删除
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
            <DynamicIcon name="x" className="h-3.5 w-3.5" />
            清除选择
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canSelectAll}
          onClick={onSelectAll}
          className="flex items-center gap-1 text-text-secondary hover:text-text"
        >
          <DynamicIcon name={canSelectAll ? 'square' : 'check-square'} className="h-3.5 w-3.5" />
          {hasAssets ? (canSelectAll ? '全选' : '已全选') : '全选'}
        </Button>
      </div>
    </div>
  )
}
