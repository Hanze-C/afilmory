import { clsxm } from '@afilmory/utils'
import { NavLink } from 'react-router'

import { useAuthUserValue } from '~/atoms/auth'

import { UserMenu } from './UserMenu'

const navigationTabs = [
  { label: 'Dashboard', path: '/' },
  { label: 'Photos', path: '/photos' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Settings', path: '/settings' },
] as const

export function Header() {
  const user = useAuthUserValue()

  return (
    <header className="bg-background relative shrink-0 border-b border-fill-tertiary/50">
      <div className="flex h-14 items-center px-6">
        {/* Logo/Brand */}
        <a href="/" className="text-text mr-8 text-base font-semibold tracking-tight">
          Afilmory
        </a>

        {/* Navigation Tabs */}
        <nav className="flex flex-1 items-center gap-1">
          {navigationTabs.map((tab) => (
            <NavLink key={tab.path} to={tab.path} end={tab.path === '/'}>
              {({ isActive }) => (
                <div
                  className={clsxm(
                    'relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    'hover:bg-fill/30',
                    isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text',
                  )}
                >
                  {tab.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side - User Menu */}
        {user && (
          <div className="border-fill-tertiary/50 ml-auto border-l pl-4">
            <UserMenu user={user} />
          </div>
        )}
      </div>
    </header>
  )
}
