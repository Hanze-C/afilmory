'use client'

import Link from 'next/link'

import { Button } from '~/components/ui/button/Button'
import { radius, shadows } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

export const CTASection = () => (
  <section>
    <div
      className={clsxm(
        'relative overflow-hidden border border-white/10 bg-gradient-to-br from-accent/40 via-purple-600/40 to-slate-900/70 p-10 text-white',
        radius['3xl'],
        shadows.heavy,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] opacity-80" />
      <div className="relative space-y-6">
        <p className="text-sm tracking-[0.4em] text-white/70 uppercase">
          Ready?
        </p>
        <h2 className="text-4xl leading-tight font-semibold">
          构建属于你的 Afilmory，
          <span className="text-accent">今日即可上线。</span>
        </h2>
        <p className="text-lg text-white/80">
          结合 builder、apps/web、apps/ssr 与
          be/apps/core，五分钟完成部署，随时扩展自定义 UI、数据源或地图风格。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            asChild
            className="min-w-[160px] border border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link
              href="https://github.com/Afilmory/photo-gallery-site"
              target="_blank"
              rel="noreferrer"
            >
              Fork & 部署
            </Link>
          </Button>
          <Link
            href="https://afilmory.innei.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
          >
            查看线上示例
            <i className="i-lucide-arrow-up-right size-4" />
          </Link>
        </div>
      </div>
    </div>
  </section>
)
