import { PageTabs } from '~/components/navigation/PageTabs'

const SETTINGS_TABS = [
  {
    id: 'general',
    label: '通用设置',
    path: '/settings',
    end: true,
  },
  {
    id: 'storage',
    label: '素材存储',
    path: '/settings/storage',
    end: false,
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
