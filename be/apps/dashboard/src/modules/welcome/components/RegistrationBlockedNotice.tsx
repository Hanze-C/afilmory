import { Button, LinearBorderContainer } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { m } from 'motion/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import { buildTenantUrl } from '~/modules/auth/utils/domain'

import { buildHomeUrl, getCurrentHostname } from './tenant-utils'

interface RegistrationBlockedNoticeProps {
  tenantSlug: string | null
}

export const RegistrationBlockedNotice = ({ tenantSlug }: RegistrationBlockedNoticeProps) => {
  const navigate = useNavigate()
  const hostname = useMemo(() => getCurrentHostname(), [])
  const workspaceLoginUrl = useMemo(() => {
    if (!tenantSlug) {
      return null
    }
    try {
      return buildTenantUrl(tenantSlug, '/platform/login')
    } catch {
      return null
    }
  }, [tenantSlug])

  const handleOpenWorkspace = () => {
    if (workspaceLoginUrl) {
      window.location.href = workspaceLoginUrl
      return
    }
    navigate('/login', { replace: true })
  }

  const handleReturnHome = () => {
    const homeUrl = buildHomeUrl()
    window.location.href = homeUrl
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col bg-background text-text">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <LinearBorderContainer>
          <div className="bg-background-tertiary relative w-full max-w-[640px] overflow-hidden border border-white/5">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -inset-32 bg-linear-to-br from-accent/20 via-transparent to-transparent blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            </div>

            <div className="relative p-10 sm:p-12">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={Spring.presets.smooth}>
                <p className="text-text-tertiary mb-3 text-xs font-semibold uppercase tracking-[0.55em]">400</p>
                <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Workspace already configured</h1>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                  This workspace has already completed onboarding. You can return to your dashboard or go back to the
                  login screen to switch accounts before continuing.
                </p>

                {(hostname || tenantSlug) && (
                  <div className="bg-material-medium/40 border-fill-tertiary mb-6 rounded-2xl border px-5 py-4 text-sm">
                    {tenantSlug ? (
                      <p className="text-text-secondary">
                        Workspace slug: <span className="text-text font-medium">{tenantSlug}</span>
                      </p>
                    ) : null}
                    {hostname ? (
                      <p className="text-text-secondary mt-1">
                        Requested host: <span className="text-text font-medium">{hostname}</span>
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="primary" className="glassmorphic-btn flex-1" onClick={handleOpenWorkspace}>
                    Go to workspace
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={handleReturnHome}>
                    Return home
                  </Button>
                </div>
              </m.div>
            </div>
          </div>
        </LinearBorderContainer>
      </div>
    </div>
  )
}
