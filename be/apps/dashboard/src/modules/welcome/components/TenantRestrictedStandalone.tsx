import { Button, LinearBorderContainer } from '@afilmory/ui'
import { useMemo } from 'react'

import { buildHomeUrl, buildRegistrationUrl, getCurrentHostname } from './tenant-utils'

export const TenantRestrictedStandalone = () => {
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
                <p className="text-text-tertiary mb-3 text-xs font-semibold uppercase tracking-[0.55em]">403</p>
                <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">该空间已被保留</h1>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">
                  当前访问的空间属于系统保留地址，无法直接访问仪表盘或公开站点。若要继续体验
                  Afilmory，请使用其他地址，或者注册属于你的专属空间。
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
                    去注册新空间
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
