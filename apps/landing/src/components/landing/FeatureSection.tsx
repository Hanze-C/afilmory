'use client'

import { spacing, typography } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

import { FeatureCard } from './Card'

const featureGroups = [
  {
    icon: 'i-lucide-cpu',
    title: '性能与体验',
    description: 'WebGL viewer、Masonry 布局与全屏手势带来原生级互动。',
    bullets: [
      'GPU 管线渲染 · Free transform · Tone mapping',
      'Blurhash 占位、响应式断点与浮动操作面板',
      'Glassmorphic Depth 系统 + Motion spring 动画',
    ],
  },
  {
    icon: 'i-lucide-database',
    title: '数据与同步',
    description: 'builder 多进程处理 + manifest 驱动数据流，自动增量同步。',
    bullets: [
      'S3 / GitHub / Eagle / 本地多源存储抽象',
      'EXIF、Live Photo、Fujifilm Recipe 与缩略图生成',
      'window.__MANIFEST__ 注入，前端无感刷新',
    ],
  },
  {
    icon: 'i-lucide-plug',
    title: '接入模式',
    description: 'SPA、Next.js SSR、be/apps/core 后端三种模式自由切换。',
    bullets: [
      '静态/SSR 共享 UI：apps/web + apps/ssr',
      'be/apps/core 以 Hono + Drizzle 提供实时能力',
      'OG 渲染 / SEO 元数据 / OpenGraph API',
    ],
  },
  {
    icon: 'i-lucide-globe',
    title: '全球化 & 分享',
    description: '多语言、OG、分享嵌入，天然适合出海作品集。',
    bullets: [
      'i18next 平台化，11+ 语言文件',
      '动态 OG 图 + /og/[photoId] API',
      '分享/嵌入组件、一键复制链接或 iframe',
    ],
  },
]

export const FeatureSection = () => (
  <section className={spacing.content}>
    <header className={spacing.tight}>
      <p className="text-text-secondary text-sm font-semibold tracking-[0.3em] uppercase">
        核心能力
      </p>
      <h2 className={clsxm(typography.h1, 'text-white')}>
        从性能到叙事的全链路方案
      </h2>
      <p className="text-text-secondary max-w-3xl text-base">
        项目按照 Performance / Data / Integrations / Global Experience
        四个维度拆分，便于独立扩展与部署。
      </p>
    </header>

    <div className="grid gap-6 lg:grid-cols-2">
      {featureGroups.map((group) => (
        <FeatureCard
          key={group.title}
          icon={group.icon}
          title={group.title}
          description={group.description}
          bullets={group.bullets}
        />
      ))}
    </div>
  </section>
)
