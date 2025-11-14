import { Button, Prompt } from '@afilmory/ui'
import { clsxm } from '@afilmory/utils'
import { DynamicIcon } from 'lucide-react/dynamic'

import { LinearBorderPanel } from '~/components/common/GlassPanel'
import { usePhotoAssetSummaryQuery } from '~/modules/photos/hooks'

import { useTruncatePhotoAssetsMutation } from '../hooks'

const SUMMARY_PLACEHOLDER = {
  total: 0,
  synced: 0,
  pending: 0,
  conflicts: 0,
}

const SUMMARY_STATS = [
  { id: 'total', label: '总记录', accent: 'text-text', chip: '全部' },
  { id: 'synced', label: '已同步', accent: 'text-emerald-300', chip: '正常' },
  { id: 'pending', label: '待同步', accent: 'text-amber-300', chip: '排队中' },
  { id: 'conflicts', label: '冲突', accent: 'text-rose-300', chip: '需处理' },
] as const

const numberFormatter = new Intl.NumberFormat('zh-CN')

export function DataManagementPanel() {
  const summaryQuery = usePhotoAssetSummaryQuery()
  const summary = summaryQuery.data ?? SUMMARY_PLACEHOLDER
  const truncateMutation = useTruncatePhotoAssetsMutation()

  const handleTruncate = () => {
    if (truncateMutation.isPending) {
      return
    }

    Prompt.prompt({
      title: '确认清空照片数据表？',
      description: '该操作会删除数据库中的所有照片记录，但会保留对象存储中的原始文件。清空后需要重新执行一次照片同步。',
      variant: 'danger',
      onConfirmText: '立即清空',
      onCancelText: '取消',
      onConfirm: () => truncateMutation.mutateAsync().then(() => {}),
    })
  }

  return (
    <div className="space-y-6">
      <LinearBorderPanel className="rounded-3xl bg-background-secondary/40 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <span className="shape-squircle inline-flex items-center gap-2 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <DynamicIcon name="database" className="h-4 w-4" />
              当前数据概况
            </span>
            <div className="space-y-2">
              <h3 className="text-text text-xl font-semibold">照片数据表状态</h3>
              <p className="text-text-secondary text-sm">以下统计来自数据库记录，不含对象存储中的原始文件。</p>
            </div>
            {summaryQuery.isError ? <p className="text-red text-sm">无法加载数据统计，请稍后再试。</p> : null}
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUMMARY_STATS.map((stat) => (
              <div
                key={stat.id}
                className={clsxm(
                  'rounded-2xl border border-white/5 bg-background-tertiary/60 px-4 py-3 shadow-sm backdrop-blur',
                  summaryQuery.isLoading && 'animate-pulse',
                )}
              >
                <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                  <span>{stat.label}</span>
                  <span className="shape-squircle bg-white/5 px-2 py-0.5 font-medium text-white/80">{stat.chip}</span>
                </div>
                <div className={clsxm('mt-2 text-2xl font-semibold', stat.accent)}>
                  {summaryQuery.isLoading ? '—' : numberFormatter.format(summary[stat.id])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </LinearBorderPanel>

      <LinearBorderPanel className="rounded-3xl bg-background-secondary/40 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red">
              <DynamicIcon name="triangle-alert" className="h-4 w-4" />
              <span className="text-sm font-semibold">危险操作</span>
            </div>
            <div>
              <h4 className="text-text text-lg font-semibold">清空照片数据表</h4>
              <p className="text-text-secondary text-sm">
                删除数据库中的所有照片记录，仅保留对象存储文件。通常用于处理数据不一致、重新同步或迁移场景。
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            isLoading={truncateMutation.isPending}
            loadingText="清理中…"
            onClick={handleTruncate}
          >
            清空数据库记录
          </Button>
        </div>
        <p className="text-text-tertiary mt-4 text-xs">
          操作完成后请立即重新执行「照片同步」，以便使用存储中的原始文件重建数据库与 manifest。
        </p>
      </LinearBorderPanel>
    </div>
  )
}
