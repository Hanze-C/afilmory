import { Button, Prompt } from '@afilmory/ui'
import { clsxm } from '@afilmory/utils'
import { DynamicIcon } from 'lucide-react/dynamic'
import { toast } from 'sonner'

import { LinearBorderPanel } from '~/components/common/GlassPanel'
import { usePhotoAssetSummaryQuery } from '~/modules/photos/hooks'

import { useDeleteTenantAccountMutation, useTruncatePhotoAssetsMutation } from '../hooks'

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
  const deleteTenantMutation = useDeleteTenantAccountMutation()

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

  const handleDeleteAccount = () => {
    if (deleteTenantMutation.isPending) {
      return
    }

    const launchFinalConfirm = () => {
      Prompt.input({
        title: '最终确认：永久删除账户',
        description: '请输入 DELETE 以确认。本操作会立即注销所有成员并删除不可恢复的数据。',
        placeholder: 'DELETE',
        variant: 'danger',
        onConfirmText: '永久删除',
        onCancelText: '返回',
        onConfirm: async (value) => {
          const normalized = value.trim().toUpperCase()
          if (normalized !== 'DELETE') {
            toast.error('确认失败', { description: '请输入 DELETE 以继续。' })
            launchFinalConfirm()
            return
          }
          if (deleteTenantMutation.isPending) {
            return
          }
          await deleteTenantMutation.mutateAsync()
        },
      })
    }

    const confirmIrreversibleStep = () => {
      Prompt.prompt({
        title: '二次确认：删除整个账户',
        description: '将彻底清除当前租户的照片、设置、同步记录以及所有成员权限，且无法撤销。',
        variant: 'danger',
        onConfirmText: '我已知晓风险',
        onCancelText: '取消',
        onConfirm: launchFinalConfirm,
      })
    }

    Prompt.prompt({
      title: '删除账户（步骤 1/3）',
      description: '删除后会立即清空当前租户下的所有数据并登出所有成员。此过程包含 3 次确认以确保安全。',
      variant: 'danger',
      onConfirmText: '继续下一步',
      onCancelText: '取消',
      onConfirm: confirmIrreversibleStep,
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <LinearBorderPanel className="bg-background-secondary/40 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 sm:space-y-4">
            <span className="shape-squircle inline-flex items-center gap-2 bg-accent/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium text-accent">
              <DynamicIcon name="database" className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              当前数据概况
            </span>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-text text-lg sm:text-xl font-semibold">照片数据表状态</h3>
              <p className="text-text-secondary text-xs sm:text-sm">
                以下统计来自数据库记录，不含对象存储中的原始文件。
              </p>
            </div>
            {summaryQuery.isError ? (
              <p className="text-red text-xs sm:text-sm">无法加载数据统计，请稍后再试。</p>
            ) : null}
          </div>
          <div className="grid w-full gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {SUMMARY_STATS.map((stat) => (
              <LinearBorderPanel
                key={stat.id}
                className={clsxm(
                  'bg-background-tertiary/60 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm backdrop-blur',
                  summaryQuery.isLoading && 'animate-pulse',
                )}
              >
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-text-tertiary">
                  <span>{stat.label}</span>
                  <span className="shape-squircle bg-white/5 px-1.5 sm:px-2 py-0.5 font-medium text-white/80 text-[9px] sm:text-[10px]">
                    {stat.chip}
                  </span>
                </div>
                <div className={clsxm('mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold', stat.accent)}>
                  {summaryQuery.isLoading ? '—' : numberFormatter.format(summary[stat.id])}
                </div>
              </LinearBorderPanel>
            ))}
          </div>
        </div>
      </LinearBorderPanel>

      <LinearBorderPanel className="bg-background-secondary/40 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-red">
              <DynamicIcon name="triangle-alert" className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              <span className="text-xs sm:text-sm font-semibold">危险操作</span>
            </div>
            <div>
              <h4 className="text-text text-base sm:text-lg font-semibold">清空照片数据表</h4>
              <p className="text-text-secondary text-xs sm:text-sm">
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
            className="w-full sm:w-auto"
          >
            清空数据库记录
          </Button>
        </div>
        <p className="text-text-tertiary mt-3 sm:mt-4 text-[11px] sm:text-xs">
          操作完成后请立即重新执行「照片同步」，以便使用存储中的原始文件重建数据库与 manifest。
        </p>
      </LinearBorderPanel>

      <LinearBorderPanel className="bg-red-500/5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-red">
              <DynamicIcon name="radiation" className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              <span className="text-xs sm:text-sm font-semibold">账户清除（不可逆）</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-text text-base sm:text-lg font-semibold">删除当前租户与所有数据</h4>
              <p className="text-text-secondary text-xs sm:text-sm">
                此操作会在数据库中彻底删除当前租户、照片记录、同步日志、权限成员等所有信息。执行后将登出所有成员并无法恢复，
                系统会强制进行三次确认以避免误操作。
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
            loadingText="正在销毁…"
            isLoading={deleteTenantMutation.isPending}
            className="w-full sm:w-auto"
          >
            永久删除账户
          </Button>
        </div>
        <p className="text-text-tertiary mt-3 sm:mt-4 text-[11px] sm:text-xs">
          如需在未来重新使用本服务，需要重新注册新的租户并重新上传所有资产。该操作不会删除对象存储中的原始文件，但会移除与之关联的所有数据库记录。
        </p>
      </LinearBorderPanel>
    </div>
  )
}
