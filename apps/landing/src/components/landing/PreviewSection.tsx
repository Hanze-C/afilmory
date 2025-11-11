'use client'

import { blur, radius, shadows, typography } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

import { IconCard } from './Card'

const previewHighlights = [
  {
    icon: 'i-lucide-camera',
    title: '拍摄参数',
    description: '自动记录每张照片的相机、镜头、光圈、快门等信息',
    meta: 'f/1.4 · 1/125s · ISO 200',
  },
  {
    icon: 'i-lucide-map-pin',
    title: '地点标记',
    description: '在世界地图上查看你的摄影足迹，重温每次旅行',
    meta: '支持 GPS 定位',
  },
  {
    icon: 'i-lucide-expand',
    title: '全屏欣赏',
    description: '沉浸式大图查看，支持动态照片和一键分享',
    meta: '手势操作 · 快速分享',
  },
]

export const PreviewSection = () => (
  <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
    <div className="space-y-6">
      <p className="text-text-secondary text-sm font-semibold tracking-[0.3em] uppercase">
        核心功能
      </p>
      <h2 className={clsxm(typography.h1, 'text-white')}>
        专为摄影作品设计的展示方式
      </h2>
      <p className="text-text-secondary text-base">
        智能瀑布流布局让每张照片都有最佳呈现，流畅的动画过渡带来杂志般的阅读体验。
        无论是在电脑还是手机上，都能完美展示你的作品。
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
          <span className="font-medium">富士 X-T5 · 16mm f/1.4</span>
          <span className="text-text-tertiary text-xs">📍 东京</span>
        </div>
        <p className="text-text-secondary mt-2">
          经典负片模拟 · 拍摄于 2024 年 3 月
        </p>
      </div>
    </div>
  </div>
)
