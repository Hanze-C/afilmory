'use client'

import { blur, radius, shadows, spacing, typography } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

const workflowSteps = [
  {
    icon: 'i-lucide-rocket',
    title: 'Builder Pipeline',
    description: 'packages/builder 负责拉取、处理、分析与生成 manifest。',
    points: [
      'Storage Sync：S3 / GitHub / Eagle 增量拉取',
      'Format & Thumbnail：HEIC/TIFF 转码 + Blurhash',
      'EXIF / GPS / Fujifilm Recipe / HDR 元数据提取',
    ],
  },
  {
    icon: 'i-lucide-plug-zap',
    title: 'Manifest 注入',
    description:
      'apps/ssr 在 Next.js 层注入 window.__MANIFEST__，开启 SEO/OG。',
    points: [
      'index.html 模板内联 manifest',
      'OG 动态渲染 + Metadata 替换',
      'MapLibre、PhotoLoader、Viewer 共享数据源',
    ],
  },
  {
    icon: 'i-lucide-monitor-play',
    title: 'SPA 消费',
    description:
      'apps/web 作为 Vite SPA，自主渲染 Masonry、Viewer、地图与浮动 UI。',
    points: [
      'PhotoLoader 单例在客户端初始化',
      'Jotai + TanStack Query 状态与数据层',
      'Glassmorphic Depth 组件交付最终体验',
    ],
  },
]

export const WorkflowSection = () => (
  <section className={spacing.content}>
    <div>
      <p className="text-text-secondary text-sm font-semibold tracking-[0.3em] uppercase">
        数据流
      </p>
      <h2 className={clsxm(typography.h1, 'text-white')}>
        Builder → Manifest → SPA
      </h2>
      <p className="text-text-secondary text-base">
        README 中的流水线拆解为三个关键阶段，帮助你明确扩展点与监控点。
      </p>
    </div>
    <div
      className={clsxm(
        'relative border border-white/10 bg-white/5 p-8',
        radius['3xl'],
        blur['3xl'],
        shadows.heavy,
      )}
    >
      <div className="absolute top-10 bottom-10 left-12 w-px bg-white/10" />
      <ol className="space-y-10">
        {workflowSteps.map((step, index) => (
          <li key={step.title} className="relative pl-16">
            <div className="border-accent/20 bg-accent/10 text-accent absolute top-1 left-0 flex size-12 items-center justify-center rounded-full border">
              <i className={clsxm('size-5', step.icon)} aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {index + 1}. {step.title}
              </p>
              <p className="text-text-secondary mt-2 text-sm">
                {step.description}
              </p>
              <ul className="text-text-secondary mt-3 space-y-2 text-sm">
                {step.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="bg-accent mt-1 size-1.5 rounded-full" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
)
