'use client'

import { blur, radius, shadows, typography } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

import { IconCard } from './Card'

const previewHighlights = [
  {
    icon: 'i-lucide-aperture',
    title: 'EXIF HUD',
    description: '完整记录光圈、快门、ISO、镜头、配方、HDR 信息。',
    meta: 'f/1.4 · 1/125s · ISO 200',
  },
  {
    icon: 'i-lucide-map',
    title: '地图探索',
    description: 'MapLibre 地图、GPS 聚合、热力探索每一次旅程。',
    meta: '84% 带 GPS · Cluster & Pin',
  },
  {
    icon: 'i-lucide-maximize',
    title: 'Fullscreen Viewer',
    description: 'WebGL 全屏查看器支持手势、Live Photo 与分享。',
    meta: '手势 · 分享 · Live',
  },
]

export const PreviewSection = () => (
  <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
    <div className="space-y-6">
      <p className="text-text-secondary text-sm font-semibold tracking-[0.3em] uppercase">
        即刻预览
      </p>
      <h2 className={clsxm(typography.h1, 'text-white')}>
        沉浸式图库体验的每个细节
      </h2>
      <p className="text-text-secondary text-base">
        Masonry 布局、MapLibre 地图、WebGL Viewer、EXIF HUD 等模块相互呼应，通过
        motion 的 spring 动画与 glassmorphic
        深度层级，构建出一个既具未来感又保持性能稳定的浏览体验。
      </p>

      <div className="space-y-4">
        {previewHighlights.map((item) => (
          <IconCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
            meta={item.meta}
          />
        ))}
      </div>
    </div>

    <PreviewMockup />
  </section>
)

const PreviewMockup = () => (
  <div className="relative">
    <div className="absolute inset-x-8 -top-10 -bottom-10 rounded-[40px] bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-3xl" />
    <div
      className={clsxm(
        'relative border border-white/15 bg-white/5 p-6',
        radius['3xl'],
        blur['3xl'],
        shadows.heavy,
      )}
    >
      <div className="text-text-secondary flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-yellow-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
        <span>gallery.mxte.cc</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-white/0 shadow-inner shadow-black/40"
          />
        ))}
      </div>
      <div className="bg-background/70 text-text-secondary mt-6 rounded-2xl border border-white/10 p-4 text-sm">
        <div className="text-text flex items-center justify-between">
          <span className="font-medium">EXIF · X-T5 · XF16mmF1.4</span>
          <span className="text-text-tertiary text-xs">Map locked</span>
        </div>
        <p className="text-text-secondary mt-2">
          GPS 35.6895 / 139.6917 · Fujifilm Classic Chrome · Blurhash ready.
        </p>
      </div>
    </div>
  </div>
)
