import { Button } from '@afilmory/ui'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useMainPageLayout } from '~/components/layouts/MainPageLayout'

import { runPhotoSync } from '../../api'
import type { PhotoSyncResult, RunPhotoSyncPayload } from '../../types'

type PhotoSyncActionsProps = {
  onCompleted: (result: PhotoSyncResult, context: { dryRun: boolean }) => void
}

export const PhotoSyncActions = ({ onCompleted }: PhotoSyncActionsProps) => {
  const { setHeaderActionState } = useMainPageLayout()
  const [pendingMode, setPendingMode] = useState<'dry-run' | 'apply' | null>(
    null,
  )

  const mutation = useMutation({
    mutationFn: async (variables: RunPhotoSyncPayload) => {
      return await runPhotoSync({ dryRun: variables.dryRun ?? false })
    },
    onMutate: (variables) => {
      setPendingMode(variables.dryRun ? 'dry-run' : 'apply')
      setHeaderActionState({ disabled: true, loading: true })
    },
    onSuccess: (data, variables) => {
      onCompleted(data, { dryRun: variables.dryRun ?? false })
      const { inserted, updated, conflicts } = data.summary
      toast.success(variables.dryRun ? '同步预览完成' : '照片同步完成', {
        description: `新增 ${inserted} · 更新 ${updated} · 冲突 ${conflicts}`,
      })
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '照片同步失败，请稍后重试。'
      toast.error('同步失败', { description: message })
    },
    onSettled: () => {
      setPendingMode(null)
      setHeaderActionState({ disabled: false, loading: false })
    },
  })

  const { isPending } = mutation

  useEffect(() => {
    return () => {
      setHeaderActionState({ disabled: false, loading: false })
    }
  }, [setHeaderActionState])

  const handleSync = (dryRun: boolean) => {
    mutation.mutate({ dryRun })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        isLoading={isPending && pendingMode === 'dry-run'}
        onClick={() => handleSync(true)}
      >
        预览同步
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={isPending}
        isLoading={isPending && pendingMode === 'apply'}
        onClick={() => handleSync(false)}
      >
        同步照片
      </Button>
    </div>
  )
}
