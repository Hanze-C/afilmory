import { Button } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { useMutation } from '@tanstack/react-query'
import { m } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  MainPageLayout,
  useMainPageLayout,
} from '~/components/layouts/MainPageLayout'
import type { PhotoSyncAction, PhotoSyncResult } from '~/modules/photos'
import { runPhotoSync } from '~/modules/photos'

type PhotoSyncActionsProps = {
  onCompleted: (result: PhotoSyncResult, context: { dryRun: boolean }) => void
}

const PhotoSyncActions = ({ onCompleted }: PhotoSyncActionsProps) => {
  const { setHeaderActionState } = useMainPageLayout()
  const [pendingMode, setPendingMode] = useState<'dry-run' | 'apply' | null>(
    null,
  )

  const mutation = useMutation({
    mutationFn: async (variables: { dryRun: boolean }) => {
      return await runPhotoSync({ dryRun: variables.dryRun })
    },
    onMutate: (variables) => {
      setPendingMode(variables.dryRun ? 'dry-run' : 'apply')
      setHeaderActionState({ disabled: true, loading: true })
    },
    onSuccess: (data, variables) => {
      onCompleted(data, { dryRun: variables.dryRun })

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

  useEffect(() => {
    return () => {
      setHeaderActionState({ disabled: false, loading: false })
    }
  }, [setHeaderActionState])

  const { isPending } = mutation

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

type SummaryCardProps = {
  label: string
  value: number
  tone?: 'accent' | 'warning' | 'muted'
}

const BorderOverlay = () => (
  <>
    <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
    <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
    <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
    <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
  </>
)

const SummaryCard = ({ label, value, tone }: SummaryCardProps) => {
  const toneClass =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'warning'
        ? 'text-amber-400'
        : tone === 'muted'
          ? 'text-text-secondary'
          : 'text-text'

  return (
    <div className="bg-background-tertiary relative overflow-hidden rounded-lg p-5">
      <BorderOverlay />
      <p className="text-text-tertiary text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

const actionTypeConfig: Record<
  PhotoSyncAction['type'],
  { label: string; badgeClass: string }
> = {
  insert: { label: '新增', badgeClass: 'bg-emerald-500/10 text-emerald-400' },
  update: { label: '更新', badgeClass: 'bg-sky-500/10 text-sky-400' },
  delete: { label: '删除', badgeClass: 'bg-rose-500/10 text-rose-400' },
  conflict: { label: '冲突', badgeClass: 'bg-amber-500/10 text-amber-400' },
  noop: { label: '跳过', badgeClass: 'bg-slate-500/10 text-slate-400' },
}

const ActionRow = ({ action }: { action: PhotoSyncAction }) => {
  const config = actionTypeConfig[action.type]
  const resolutionLabel =
    action.resolution === 'prefer-storage'
      ? '以存储为准'
      : action.resolution === 'prefer-database'
        ? '以数据库为准'
        : null

  return (
    <div className="bg-fill/10 relative overflow-hidden rounded-lg p-4">
      <BorderOverlay />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}
          >
            {config.label}
          </span>
          <code className="text-text-secondary text-xs">
            {action.storageKey}
          </code>
        </div>
        <span className="text-text-tertiary text-xs">
          {action.applied ? '已应用' : '未应用'}
          {resolutionLabel ? ` · ${resolutionLabel}` : ''}
        </span>
      </div>
      {action.reason ? (
        <p className="text-text-tertiary mt-2 text-sm">{action.reason}</p>
      ) : null}
    </div>
  )
}

type PhotoSyncResultPanelProps = {
  result: PhotoSyncResult | null
  lastWasDryRun: boolean | null
}

const PhotoSyncResultPanel = ({
  result,
  lastWasDryRun,
}: PhotoSyncResultPanelProps) => {
  const summaryItems = useMemo(
    () =>
      result
        ? [
            { label: '存储对象', value: result.summary.storageObjects },
            { label: '数据库记录', value: result.summary.databaseRecords },
            {
              label: '新增照片',
              value: result.summary.inserted,
              tone: 'accent' as const,
            },
            { label: '更新记录', value: result.summary.updated },
            { label: '删除记录', value: result.summary.deleted },
            {
              label: '冲突条目',
              value: result.summary.conflicts,
              tone:
                result.summary.conflicts > 0
                  ? ('warning' as const)
                  : ('muted' as const),
            },
            {
              label: '跳过条目',
              value: result.summary.skipped,
              tone: 'muted' as const,
            },
          ]
        : [],
    [result],
  )
  if (!result) {
    return (
      <div className="bg-background-tertiary relative overflow-hidden rounded-lg p-6">
        <BorderOverlay />
        <div className="space-y-2">
          <h2 className="text-text text-base font-semibold">尚未执行同步</h2>
          <p className="text-text-tertiary text-sm">
            请在系统设置中配置并激活存储提供商，然后使用右上角的按钮执行同步操作。预览模式不会写入数据，可用于安全检查。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-text text-lg font-semibold">同步摘要</h2>
          <p className="text-text-tertiary text-sm">
            {lastWasDryRun === null
              ? '以下为最新同步结果。'
              : lastWasDryRun
                ? '最近执行了预览模式，数据库未发生变更。'
                : '最近一次同步结果已写入数据库。'}
          </p>
        </div>
        <p className="text-text-tertiary text-xs">
          操作总数：{result.actions.length}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {summaryItems.map((item, index) => (
          <m.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...Spring.presets.smooth, delay: index * 0.04 }}
          >
            <SummaryCard
              label={item.label}
              value={item.value}
              tone={item.tone}
            />
          </m.div>
        ))}
      </div>

      <div className="bg-background-tertiary relative overflow-hidden rounded-lg">
        <BorderOverlay />
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-text text-base font-semibold">同步操作明细</h3>
            <span className="text-text-tertiary text-xs">
              {lastWasDryRun
                ? '预览模式 · 未应用变更'
                : '实时模式 · 结果已写入'}
            </span>
          </div>

          {result.actions.length === 0 ? (
            <p className="text-text-tertiary mt-4 text-sm">
              同步完成，未检测到需要处理的对象。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {result.actions.slice(0, 20).map((action, index) => (
                <m.div
                  key={`${action.storageKey}-${action.type}-${action.photoId ?? 'none'}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...Spring.presets.snappy, delay: index * 0.03 }}
                >
                  <ActionRow action={action} />
                </m.div>
              ))}
              {result.actions.length > 20 ? (
                <p className="text-text-tertiary text-xs">
                  仅展示前 20 条操作，更多详情请使用核心 API 查询。
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Component = () => {
  const [result, setResult] = useState<PhotoSyncResult | null>(null)
  const [lastWasDryRun, setLastWasDryRun] = useState<boolean | null>(null)

  return (
    <MainPageLayout
      title="照片库"
      description="从已激活的存储提供商同步照片清单，并解决潜在冲突。"
    >
      <MainPageLayout.Actions>
        <PhotoSyncActions
          onCompleted={(data, context) => {
            setResult(data)
            setLastWasDryRun(context.dryRun)
          }}
        />
      </MainPageLayout.Actions>

      <PhotoSyncResultPanel result={result} lastWasDryRun={lastWasDryRun} />
    </MainPageLayout>
  )
}
