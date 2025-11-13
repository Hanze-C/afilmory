import { ScrollArea } from '@afilmory/ui'
import { Navigate, NavLink, Outlet } from 'react-router'

import { useAuthUserValue, useIsSuperAdmin } from '~/atoms/auth'
import { SuperAdminUserMenu } from '~/components/common/SuperAdminUserMenu'

export function Component() {
  const user = useAuthUserValue()
  const isSuperAdmin = useIsSuperAdmin()
  const navItems = [
    { to: '/superadmin/settings', label: '系统设置', end: true },
    { to: '/superadmin/debug', label: 'Builder 调试', end: false },
  ] as const

  if (user && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen flex-col">
      <nav className="bg-background-tertiary relative shrink-0 px-6 py-3">
        {/* Bottom border with gradient */}
        <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />

        <div className="flex items-center justify-between gap-6">
          {/* Logo/Brand */}
          <div className="text-text text-base font-semibold">Afilmory · System Settings</div>

          <div className="flex flex-1 items-center gap-1">
            {navItems.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end}>
                {({ isActive }) => (
                  <div
                    className="relative overflow-hidden rounded-md shape-squircle px-3 py-1.5 group data-[state=active]:bg-accent/80 data-[state=active]:text-white"
                    data-state={isActive ? 'active' : 'inactive'}
                  >
                    <span className="relative z-10 text-[13px] font-medium">{tab.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right side - User Menu */}
          {user && <SuperAdminUserMenu user={user} />}
        </div>
      </nav>

      <main className="bg-background flex-1 overflow-hidden">
        <ScrollArea rootClassName="h-full" viewportClassName="h-full">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
