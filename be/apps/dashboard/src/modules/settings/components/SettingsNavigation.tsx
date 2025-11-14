import { PageTabs } from '~/components/navigation/PageTabs'

const SETTINGS_TABS = [
  {
    id: 'site',
    label: '站点设置',
    path: '/settings/site',
    end: true,
  },
  {
    id: 'user',
    label: '用户信息',
    path: '/settings/user',
    end: true,
  },

  {
    id: 'account',
    label: '账号与登录',
    path: '/settings/account',
    end: true,
  },

  {
    id: 'data',
    label: '数据管理',
    path: '/settings/data',
    end: true,
  },
] as const

type SettingsNavigationProps = {
  active: (typeof SETTINGS_TABS)[number]['id']
}

export function SettingsNavigation({ active }: SettingsNavigationProps) {
  return (
    <PageTabs
      activeId={active}
      items={SETTINGS_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        to: tab.path,
        end: tab.end,
      }))}
    />
  )
}
