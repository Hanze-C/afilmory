import { Button } from '@afilmory/ui'
import { useMemo } from 'react'

import { LinearBorderContainer } from './LinearBorderContainer'

const getCurrentHostname = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.location.hostname
  } catch {
    return null
  }
}

const buildRegistrationUrl = () => {
  if (typeof window === 'undefined') {
    return '/platform/welcome'
  }

  try {
    const { protocol, host } = window.location
    return `${protocol}//${host}/platform/welcome`
  } catch {
    return '/platform/welcome'
  }
}

const buildHomeUrl = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  try {
    const { protocol, hostname, port } = window.location
    const normalizedPort = port ? `:${port}` : ''
    return `${protocol}//${hostname}${normalizedPort}`
  } catch {
    return '/'
  }
}

export const TenantMissingStandalone = () => {
  const hostname = useMemo(() => getCurrentHostname(), [])
  const registrationUrl = useMemo(() => buildRegistrationUrl(), [])
  const homeUrl = useMemo(() => buildHomeUrl(), [])

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col bg-background text-text">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <LinearBorderContainer>
          <div className="relative w-full max-w-[640px] overflow-hidden border border-white/5">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -inset-32 bg-linear-to-br from-accent/20 via-transparent to-transparent blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            </div>

            <div className="relative p-10 sm:p-12">
              <div>
                <p className="text-text-tertiary mb-3 text-xs font-semibold uppercase tracking-[0.55em]">404</p>
                <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">找不到此空间</h1>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                  我们无法在当前地址下找到可访问的空间，可能已经被移除，或者链接有误。请检查访问的地址，
                  或者直接注册一个属于自己的空间，继续使用 Afilmory 的体验。
                </p>

                {hostname && (
                  <div className="bg-material-medium/40 border-fill-tertiary mb-6 rounded-2xl border px-5 py-4 text-sm">
                    <p className="text-text-secondary">
                      请求的地址：<span className="text-text font-medium">{hostname}</span>
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="primary"
                    className="glassmorphic-btn flex-1"
                    onClick={() => (window.location.href = registrationUrl)}
                  >
                    进行注册
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => (window.location.href = homeUrl)}>
                    返回首页
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </LinearBorderContainer>
      </div>
    </div>
  )
}
