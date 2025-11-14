import { MainPageLayout } from '~/components/layouts/MainPageLayout'
import { SettingsNavigation } from '~/modules/settings'
import { SiteUserProfileForm } from '~/modules/site-settings'

export function Component() {
  return (
    <MainPageLayout title="用户信息" description="维护展示在前台的作者资料、头像与别名。">
      <div className="space-y-6">
        <SettingsNavigation active="user" />
        <SiteUserProfileForm />
      </div>
    </MainPageLayout>
  )
}
