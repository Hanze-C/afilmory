import { clsxm } from '@afilmory/utils'
import { NavLink } from 'react-router'

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

interface SettingsNavigationProps {
  active: (typeof SETTINGS_TABS)[number]['id']
}

export const SettingsNavigation = ({ active }: SettingsNavigationProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SETTINGS_TABS.map((tab) => (
        <NavLink key={tab.id} to={tab.path} end={tab.end}>
          {({ isActive }) => {
            const selected = isActive || active === tab.id
            return (
              <span
                className={clsxm(
                  'inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  selected
                    ? 'bg-accent/15 text-accent'
                    : 'bg-fill/10 text-text-secondary hover:bg-fill/20 hover:text-text',
                )}
              >
                {tab.label}
              </span>
            )
          }}
        </NavLink>
      ))}
    </div>
  )
}
