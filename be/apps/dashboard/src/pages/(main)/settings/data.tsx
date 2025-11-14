import { MainPageLayout } from '~/components/layouts/MainPageLayout'
import { DataManagementPanel } from '~/modules/data-management'
import { SettingsNavigation } from '~/modules/settings'

export function Component() {
  return (
    <MainPageLayout title="数据管理" description="执行数据库级别的维护操作，以保持照片数据与对象存储一致。">
      <div className="space-y-6">
        <SettingsNavigation active="data" />
        <DataManagementPanel />
      </div>
    </MainPageLayout>
  )
}
