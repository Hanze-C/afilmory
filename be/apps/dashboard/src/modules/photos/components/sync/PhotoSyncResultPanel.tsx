import { Button, Skeleton } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { m } from 'motion/react'
import { useMemo } from 'react'

import type {
  PhotoAssetSummary,
  PhotoSyncAction,
  PhotoSyncResult,
  PhotoSyncSnapshot,
} from '../../types'

const BorderOverlay = () => (
  <>
    <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
    <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
    <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
    <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
  </>
)

type SummaryCardProps = {
  label: string
  value: number
  tone?: 'accent' | 'warning' | 'muted'
}

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
      <p className="text-text-tertiary text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

type PhotoSyncResultPanelProps = {
  result: PhotoSyncResult | null
  lastWasDryRun: boolean | null
  baselineSummary?: PhotoAssetSummary | null
  isSummaryLoading?: boolean
  onRequestStorageUrl?: (storageKey: string) => Promise<string>
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

const SUMMARY_SKELETON_KEYS = [
  'summary-skeleton-1',
  'summary-skeleton-2',
  'summary-skeleton-3',
  'summary-skeleton-4',
]

export const PhotoSyncResultPanel = ({
  result,
  lastWasDryRun,
  baselineSummary,
  isSummaryLoading,
  onRequestStorageUrl,
}: PhotoSyncResultPanelProps) => {
  const summaryItems = useMemo(() => {
    if (result) {
      return [
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
    }

    if (baselineSummary) {
      return [
        { label: '数据库记录', value: baselineSummary.total },
        { label: '同步完成', value: baselineSummary.synced },
        {
          label: '冲突条目',
          value: baselineSummary.conflicts,
          tone:
            baselineSummary.conflicts > 0
              ? ('warning' as const)
              : ('muted' as const),
        },
        {
          label: '待处理',
          value: baselineSummary.pending,
          tone:
            baselineSummary.pending > 0
              ? ('accent' as const)
              : ('muted' as const),
        },
      ]
    }

    return []
  }, [result, baselineSummary])

  const renderManifestMetadata = (
    manifest: PhotoSyncAction['manifestAfter'],
  ) => {
    if (!manifest) return null

    const dimensions = `${manifest.width} × ${manifest.height}`
    const sizeMB =
      typeof manifest.size === 'number' && manifest.size > 0
        ? `${(manifest.size / (1024 * 1024)).toFixed(2)} MB`
        : '未知'

    return (
      <dl className="text-text-tertiary mt-2 space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt>照片 ID</dt>
          <dd className="text-text truncate text-right">{manifest.id}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>尺寸</dt>
          <dd className="text-text text-right">{dimensions}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>大小</dt>
          <dd className="text-text text-right">{sizeMB}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>更新时间</dt>
          <dd className="text-text text-right">
            {new Date(manifest.lastModified).toLocaleString()}
          </dd>
        </div>
      </dl>
    )
  }

  const handleOpenOriginal = async (action: PhotoSyncAction) => {
    const manifest = action.manifestAfter ?? action.manifestBefore
    if (!manifest) return

    const candidate = manifest.originalUrl ?? manifest.thumbnailUrl
    if (candidate) {
      window.open(candidate, '_blank', 'noopener,noreferrer')
      return
    }

    if (!onRequestStorageUrl) return

    try {
      const url = await onRequestStorageUrl(action.storageKey)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(`无法打开原图：${message}`)
    }
  }

  const renderActionDetails = (action: PhotoSyncAction) => {
    const config = actionTypeConfig[action.type]
    const resolutionLabel =
      action.resolution === 'prefer-storage'
        ? '以存储为准'
        : action.resolution === 'prefer-database'
          ? '以数据库为准'
          : null
    const beforeManifest = action.manifestBefore
    const afterManifest = action.manifestAfter

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
          <span className="text-text-tertiary inline-flex items-center gap-1 text-xs">
            <span>{action.applied ? '已应用' : '未应用'}</span>
            {resolutionLabel ? <span>· {resolutionLabel}</span> : null}
          </span>
        </div>
        {action.reason ? (
          <p className="text-text-tertiary mt-2 text-sm">{action.reason}</p>
        ) : null}

        {(beforeManifest || afterManifest || action.snapshots) && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {beforeManifest ? (
              <div className="bg-background-secondary/60 border-border/20 rounded-lg border p-3">
                <p className="text-text text-sm font-semibold">同步前</p>
                {beforeManifest.thumbnailUrl ? (
                  <img
                    src={beforeManifest.thumbnailUrl}
                    alt={beforeManifest.id}
                    className="mt-2 aspect-[4/3] w-full rounded-md object-cover"
                  />
                ) : null}
                {renderManifestMetadata(beforeManifest)}
              </div>
            ) : null}
            {afterManifest ? (
              <div className="bg-background-secondary/60 border-border/20 rounded-lg border p-3">
                <p className="text-text text-sm font-semibold">同步后</p>
                {afterManifest.thumbnailUrl ? (
                  <img
                    src={afterManifest.thumbnailUrl}
                    alt={afterManifest.id}
                    className="mt-2 aspect-[4/3] w-full rounded-md object-cover"
                  />
                ) : null}
                {renderManifestMetadata(afterManifest)}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="mt-3"
                  onClick={() => handleOpenOriginal(action)}
                >
                  查看原图
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {action.snapshots ? (
          <div className="text-text-tertiary mt-4 grid gap-4 text-xs md:grid-cols-2">
            {action.snapshots.before ? (
              <div>
                <p className="text-text font-semibold">元数据（数据库）</p>
                <MetadataSnapshot snapshot={action.snapshots.before} />
              </div>
            ) : null}
            {action.snapshots.after ? (
              <div>
                <p className="text-text font-semibold">元数据（存储）</p>
                <MetadataSnapshot snapshot={action.snapshots.after} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-background-tertiary relative overflow-hidden rounded-lg p-6">
        <BorderOverlay />
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-text text-base font-semibold">尚未执行同步</h2>
            <p className="text-text-tertiary text-sm">
              请在系统设置中配置并激活存储提供商，然后使用右上角的按钮执行同步操作。预览模式不会写入数据，可用于安全检查。
            </p>
          </div>
          {isSummaryLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {SUMMARY_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : summaryItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryItems.map((item) => (
                <SummaryCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>
          ) : null}
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
              {result.actions.slice(0, 20).map((action, index) => {
                const actionKey = `${action.storageKey}-${action.type}-${action.photoId ?? 'none'}-${action.manifestAfter?.id ?? action.manifestBefore?.id ?? 'unknown'}`

                return (
                  <m.div
                    key={actionKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...Spring.presets.snappy,
                      delay: index * 0.03,
                    }}
                  >
                    {renderActionDetails(action)}
                  </m.div>
                )
              })}
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

type MetadataSnapshotProps = {
  snapshot: PhotoSyncSnapshot | null | undefined
}

const MetadataSnapshot = ({ snapshot }: MetadataSnapshotProps) => {
  if (!snapshot) return null
  return (
    <dl className="mt-2 space-y-1">
      <div className="flex items-center justify-between gap-4">
        <dt>大小</dt>
        <dd className="text-text text-right">
          {snapshot.size !== null
            ? `${(snapshot.size / 1024 / 1024).toFixed(2)} MB`
            : '未知'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt>ETag</dt>
        <dd className="text-text text-right font-mono text-[10px]">
          {snapshot.etag ?? '未知'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt>更新时间</dt>
        <dd className="text-text text-right">
          {snapshot.lastModified ?? '未知'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt>元数据摘要</dt>
        <dd className="text-text text-right font-mono text-[10px]">
          {snapshot.metadataHash ?? '无'}
        </dd>
      </div>
    </dl>
  )
}
