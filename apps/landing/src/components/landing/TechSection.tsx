'use client'

import { m } from 'motion/react'

import { blur, radius, shadows, spacing, typography } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

const techStacks = [
  'React 19',
  'Next.js 15',
  'Vite',
  'Tailwind CSS v4',
  'Radix UI',
  'Framer Motion 12',
  'Jotai',
  'TanStack Query',
  'MapLibre',
  'Sharp',
  'Drizzle ORM',
  'Hono',
]

const integrationModes = [
  {
    title: 'Standalone SPA',
    description: '预构建 photos-manifest.json，纯静态部署即可运行。',
    points: [
      'Vite + Cloudflare Pages / Vercel / 静态空间',
      'CI 中运行 builder，增量更新 manifest',
      '无需服务器即可获得完整体验',
    ],
  },
  {
    title: 'Next.js SSR Host',
    description: 'apps/ssr 作为 SPA 外壳，负责注入 manifest、OG、SEO。',
    points: [
      'route.ts 捕获所有路径，返回注入后的 index.html',
      '动态 /og/[photoId] 渲染社交卡片',
      '保留 SPA 的交互，同时具备 SSR 首屏',
    ],
  },
  {
    title: 'Full Backend Flow',
    description: 'be/apps/core + be/apps/dashboard 驱动实时数据与管理。',
    points: [
      'Hono + Drizzle + PostgreSQL 全栈能力',
      'Manifest 在内存构建后注入页面',
      'Dashboard 管理、权限与指标监控',
    ],
  },
]

export const TechSection = () => (
  <section className={spacing.content}>
    <div className={spacing.tight}>
      <p className="text-text-secondary text-sm font-semibold tracking-[0.3em] uppercase">
        技术栈 & 接入
      </p>
      <h2 className={clsxm(typography.h1, 'text-white')}>现代化前后端编排</h2>
      <p className="text-text-secondary text-base">
        React 19 + Next.js 15 + Vite + motion + Tailwind v4 + Pastel Palette
        token 系统，实现 UI / 动画 / 数据的一致性。
      </p>
    </div>

    <div
      className={clsxm(
        'border border-white/10 bg-background/40 p-6',
        radius['2xl'],
        blur['3xl'],
        shadows.heavy,
      )}
    >
      <div className="flex flex-wrap gap-3">
        {techStacks.map((stack, index) => (
          <m.span
            key={stack}
            className="text-text-secondary rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            {stack}
          </m.span>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {integrationModes.map((mode) => (
          <div
            key={mode.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/30"
          >
            <p className="text-lg font-semibold text-white">{mode.title}</p>
            <p className="text-text-secondary mt-1 text-sm">
              {mode.description}
            </p>
            <ul className="text-text-secondary mt-3 space-y-2 text-sm">
              {mode.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <i
                    className="i-lucide-minus text-accent size-4"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
)
