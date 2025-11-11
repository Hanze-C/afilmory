'use client'

import Link from 'next/link'

import { Button } from '~/components/ui/button/Button'
import { radius } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

export const CTASection = () => (
  <section>
    <div
      className={clsxm(
        'relative overflow-hidden border border-white/10 bg-gradient-to-br from-accent/40 via-purple-600/40 to-slate-900/70 p-10 text-white',
        radius['3xl'],
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] opacity-80" />
      <div className="relative space-y-6">
        <p className="text-sm tracking-[0.4em] text-white/70 uppercase">
          开始使用
        </p>
        <h2 className="text-4xl leading-tight font-semibold">
          5 分钟搭建你的
          <span className="text-accent">专属摄影展示空间</span>
        </h2>
        <p className="text-lg text-white/80">
          完全免费开源，无需编程基础。跟随文档指引，快速部署属于你的摄影作品集网站。
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
              查看使用教程
            </Link>
          </Button>
          <Link
            href="https://afilmory.innei.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
          >
            浏览在线示例
            <i className="i-lucide-arrow-up-right size-4" />
          </Link>
        </div>
      </div>
    </div>
  </section>
)
