 'use client'

import Link from 'next/link'
import { m } from 'motion/react'

import { Button } from '~/components/ui/button/Button'
import { clsxm } from '~/lib/helper'

const heroHighlights = [
  { title: 'WebGL Viewer', description: '60fps 缩放 / 漫游 / HDR' },
  { title: 'Manifest 驱动', description: 'window.__MANIFEST__ 即时注入' },
  { title: '地图探索', description: 'MapLibre GPS / Cluster / Heatmap' },
]

const metrics = [
  { label: 'WebGL 渲染', value: '60fps', detail: '平移 · 缩放 · HDR' },
  { label: '增量同步', value: 'S3 · GitHub', detail: '多存储后端' },
  { label: '照片节点', value: '2k+', detail: 'EXIF · Live Photo · Blurhash' },
  { label: '多语言', value: '11', detail: 'i18n · 动态 OG' },
]

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
    description: 'apps/ssr 在 Next.js 层注入 window.__MANIFEST__，开启 SEO/OG。',
    points: [
      'index.html 模板内联 manifest',
      'OG 动态渲染 + Metadata 替换',
      'MapLibre、PhotoLoader、Viewer 共享数据源',
    ],
  },
  {
    icon: 'i-lucide-monitor-play',
    title: 'SPA 消费',
    description: 'apps/web 作为 Vite SPA，自主渲染 Masonry、Viewer、地图与浮动 UI。',
    points: [
      'PhotoLoader 单例在客户端初始化',
      'Jotai + TanStack Query 状态与数据层',
      'Glassmorphic Depth 组件交付最终体验',
    ],
  },
]

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

const heroTiles = [
  {
    id: 'tile-masonry',
    title: 'Masonry Flow',
    subtitle: '自适应列 · Blurhash 过渡',
    badge: 'GPU',
    className: 'col-span-2 row-span-2',
    gradient:
      'linear-gradient(135deg, rgba(15,76,129,0.65), rgba(0,122,255,0.35))',
  },
  {
    id: 'tile-exif',
    title: 'EXIF',
    subtitle: 'Fujifilm Recipe · HDR',
    badge: 'metadata',
    className: 'col-span-1 row-span-1',
    gradient:
      'linear-gradient(135deg, rgba(47,46,113,0.85), rgba(130,124,252,0.25))',
  },
  {
    id: 'tile-map',
    title: 'Map Explorer',
    subtitle: 'GPS Cluster / Heatmap',
    badge: 'MapLibre',
    className: 'col-span-1 row-span-2',
    gradient:
      'linear-gradient(135deg, rgba(0,150,136,0.8), rgba(0,212,255,0.3))',
  },
  {
    id: 'tile-viewer',
    title: 'Fullscreen Viewer',
    subtitle: 'Live Photo / 分享',
    badge: 'viewer',
    className: 'col-span-2 row-span-1',
    gradient:
      'linear-gradient(135deg, rgba(255,87,34,0.65), rgba(255,193,7,0.25))',
  },
]

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-background pb-32 text-text">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-16 pt-12 sm:px-6 lg:px-0">
        <HeroSection />
        <MetricStrip />
        <PreviewSection />
        <FeatureSection />
        <WorkflowSection />
        <TechSection />
        <CTASection />
      </div>
    </div>
  )
}

const HeroSection = () => (
  <section className="relative flex flex-col gap-12 lg:flex-row lg:items-center">
    <div className="flex flex-1 flex-col gap-8">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-accent/90 backdrop-blur">
        <i className="i-lucide-sparkles size-4" aria-hidden />
        Glassmorphic Depth Design System
      </span>

      <div className="space-y-5">
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          Afilmory
          <span className="block bg-gradient-to-r from-sky-300 via-accent to-purple-400 bg-clip-text text-transparent">
            让照片叙事具备科幻感
          </span>
        </h1>
        <p className="max-w-2xl text-base text-text-secondary sm:text-lg">
          以 WebGL、Motion 与 manifest 驱动的全栈照片站框架。支持增量同步、EXIF
          深度解析、MapLibre 地理探索，以及 Next.js 提供的 SEO / OG
          能力，帮你轻松打造沉浸式影像叙事。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          asChild
          className="min-w-[160px] bg-gradient-to-r from-sky-400 to-accent text-background shadow-lg shadow-accent/30"
        >
          <Link href="https://afilmory.innei.in" target="_blank" rel="noreferrer">
            立即体验
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link
            href="https://github.com/Afilmory/photo-gallery-site#-features"
            target="_blank"
            rel="noreferrer"
          >
            查看 README
          </Link>
        </Button>
        <Link
          href="https://github.com/Afilmory/photo-gallery-site"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-text"
        >
          <span>Star on GitHub</span>
          <i className="i-lucide-arrow-up-right size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <ul className="mt-4 flex flex-wrap gap-6 text-sm text-text-secondary sm:text-base">
        {heroHighlights.map((item) => (
          <li key={item.title} className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent/70 shadow-[0_0_12px_rgba(0,122,255,0.8)]" />
            <div>
              <p className="font-medium text-text">{item.title}</p>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <HeroPreview />
  </section>
)

const HeroPreview = () => (
  <div className="relative flex flex-1 justify-center">
    <div className="relative w-full max-w-xl">
      <m.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {heroTiles.map((tile, index) => (
          <m.div
            key={tile.id}
            className={clsxm(
              'group relative overflow-hidden rounded-[28px] border border-white/15 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
              tile.className,
            )}
            style={{
              backgroundImage: tile.gradient,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.08, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/80">
              <span>{tile.badge}</span>
              <i className="i-lucide-chevrons-up size-4 text-white/70" aria-hidden />
            </div>
            <p className="mt-6 text-lg font-semibold">{tile.title}</p>
            <p className="text-sm text-white/80">{tile.subtitle}</p>
            <div className="pointer-events-none absolute inset-x-4 bottom-4 h-1 rounded-full bg-white/30 opacity-0 blur-lg transition duration-500 group-hover:opacity-100" />
          </m.div>
        ))}
      </m.div>

      <m.div
        aria-hidden
        className="absolute -right-6 top-4 w-56 rounded-3xl border border-white/10 bg-background/80 p-4 text-sm text-text shadow-2xl backdrop-blur-2xl"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
          window.__MANIFEST__
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">
            hydrated
          </span>
        </div>
        <div className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed text-text-secondary">
          <p>{'{ data: 2048 photos }'}</p>
          <p>{'cameras: 12 · lenses: 18'}</p>
          <p>{'blurhash: true · livePhoto: 86'}</p>
        </div>
      </m.div>

      <m.div
        aria-hidden
        className="absolute -left-6 bottom-6 w-60 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-background to-background/80 p-4 text-sm shadow-xl backdrop-blur-2xl"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
          <i className="i-lucide-map-pin size-4" />
          Map Explorer
        </div>
        <p className="mt-3 text-xs text-white/80">242 geotagged stories online.</p>
        <div className="mt-4 flex items-center justify-between text-[11px] text-white/70">
          <span>Cluster · Heatmap</span>
          <span>↗︎ fully interactive</span>
        </div>
      </m.div>
    </div>
  </div>
)

const MetricStrip = () => (
  <section>
    <m.div
      className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 text-sm text-text-secondary shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-[40px] sm:grid-cols-2 lg:grid-cols-4"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-white/5 bg-background/60 px-4 py-5 shadow-inner shadow-black/20"
        >
          <p className="text-xs uppercase tracking-widest text-text-tertiary">{metric.label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
          <p>{metric.detail}</p>
        </div>
      ))}
    </m.div>
  </section>
)

const PreviewSection = () => (
  <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
    <div className="space-y-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-text-secondary">
        即刻预览
      </p>
      <h2 className="text-3xl font-semibold text-white">沉浸式图库体验的每个细节</h2>
      <p className="text-base text-text-secondary">
        Masonry 布局、MapLibre 地图、WebGL Viewer、EXIF HUD
        等模块相互呼应，通过 motion 的 spring 动画与 glassmorphic 深度层级，构建出一个既具未来感又保持性能稳定的浏览体验。
      </p>

      <div className="space-y-4">
        {previewHighlights.map((item) => (
          <div
            key={item.title}
            className="group rounded-3xl border border-white/10 bg-background/50 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition hover:border-accent/40 hover:bg-background/80"
          >
            <div className="flex items-center gap-3 text-text">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <i className={clsxm('size-5', item.icon)} aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-lg font-medium">{item.title}</p>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
              <span className="text-xs text-text-tertiary">{item.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="relative">
      <div className="absolute inset-x-8 -top-10 -bottom-10 rounded-[40px] bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-3xl" />
      <div className="relative rounded-[36px] border border-white/15 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-[35px]">
        <div className="flex items-center justify-between text-xs text-text-secondary">
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
        <div className="mt-6 rounded-2xl border border-white/10 bg-background/70 p-4 text-sm text-text-secondary">
          <div className="flex items-center justify-between text-text">
            <span className="font-medium">EXIF · X-T5 · XF16mmF1.4</span>
            <span className="text-xs text-text-tertiary">Map locked</span>
          </div>
          <p className="mt-2 text-text-secondary">
            GPS 35.6895 / 139.6917 · Fujifilm Classic Chrome · Blurhash ready.
          </p>
        </div>
      </div>
    </div>
  </section>
)

const FeatureSection = () => (
  <section className="space-y-6">
    <header className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-text-secondary">
        核心能力
      </p>
      <h2 className="text-3xl font-semibold text-white">从性能到叙事的全链路方案</h2>
      <p className="max-w-3xl text-base text-text-secondary">
        项目按照 Performance / Data / Integrations / Global Experience
        四个维度拆分，便于独立扩展与部署。
      </p>
    </header>

    <div className="grid gap-6 lg:grid-cols-2">
      {featureGroups.map((group) => (
        <div
          key={group.title}
          className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-background/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[30px]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <i className={clsxm('size-5', group.icon)} aria-hidden />
            </span>
            <div>
              <p className="text-xl font-semibold text-white">{group.title}</p>
              <p className="text-sm text-text-secondary">{group.description}</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            {group.bullets.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <i className="i-lucide-check size-4 text-accent" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
)

const WorkflowSection = () => (
  <section className="space-y-8">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-text-secondary">
        数据流
      </p>
      <h2 className="text-3xl font-semibold text-white">Builder → Manifest → SPA</h2>
      <p className="text-base text-text-secondary">
        README 中的流水线拆解为三个关键阶段，帮助你明确扩展点与监控点。
      </p>
    </div>
    <div className="relative rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[45px]">
      <div className="absolute left-12 top-10 bottom-10 w-px bg-white/10" />
      <ol className="space-y-10">
        {workflowSteps.map((step, index) => (
          <li key={step.title} className="relative pl-16">
            <div className="absolute left-0 top-1 flex size-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
              <i className={clsxm('size-5', step.icon)} aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {index + 1}. {step.title}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                {step.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-accent" />
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

const TechSection = () => (
  <section className="space-y-10">
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-text-secondary">
        技术栈 & 接入
      </p>
      <h2 className="text-3xl font-semibold text-white">现代化前后端编排</h2>
      <p className="text-base text-text-secondary">
        React 19 + Next.js 15 + Vite + motion + Tailwind v4 + Pastel Palette token
        系统，实现 UI / 动画 / 数据的一致性。
      </p>
    </div>

    <div className="rounded-[32px] border border-white/10 bg-background/40 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.4)] backdrop-blur-[30px]">
      <div className="flex flex-wrap gap-3">
        {techStacks.map((stack, index) => (
          <m.span
            key={stack}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-text-secondary"
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
            <p className="mt-1 text-sm text-text-secondary">{mode.description}</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              {mode.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <i className="i-lucide-minus size-4 text-accent" aria-hidden />
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

const CTASection = () => (
  <section>
    <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-accent/40 via-purple-600/40 to-slate-900/70 p-10 text-white shadow-[0_35px_80px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] opacity-80" />
      <div className="relative space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-white/70">Ready?</p>
        <h2 className="text-4xl font-semibold leading-tight">
          构建属于你的 Afilmory，<span className="text-accent">今日即可上线。</span>
        </h2>
        <p className="text-lg text-white/80">
          结合 builder、apps/web、apps/ssr 与 be/apps/core，五分钟完成部署，随时扩展自定义
          UI、数据源或地图风格。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            asChild
            className="min-w-[160px] border border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="https://github.com/Afilmory/photo-gallery-site" target="_blank" rel="noreferrer">
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

const BackgroundDecor = () => (
  <>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(0,122,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(156,39,176,0.25), transparent 40%), radial-gradient(circle at 50% 80%, rgba(0,150,136,0.25), transparent 45%)',
      }}
    />
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,transparent_35%,rgba(255,255,255,0.05)_70%)] opacity-40" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:120px_120px]" />
  </>
)
