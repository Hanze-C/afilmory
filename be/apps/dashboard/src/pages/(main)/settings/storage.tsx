import { MainPageLayout } from '~/components/layouts/MainPageLayout'
import { SettingsNavigation } from '~/modules/settings'
import { StorageProvidersManager } from '~/modules/storage-providers'

export const Component = () => {
  return (
    <MainPageLayout
      title="素材存储与 Builder"
      description="在此配置多个素材存储提供商，并选择一个作为 Builder 的活跃源。保存后请重新运行 Builder 以加载最新配置。"
    >
      <div className="space-y-6">
        <SettingsNavigation active="storage" />
        <StorageProvidersManager />
      </div>
    </MainPageLayout>
  )
}
