'use client'

import { m } from 'motion/react'
import Link from 'next/link'

import { Button } from '~/components/ui/button/Button'
import { blur } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

const heroHighlights = [
  { title: 'WebGL Viewer', description: '60fps 缩放 / 漫游 / HDR' },
  { title: 'Manifest 驱动', description: 'window.__MANIFEST__ 即时注入' },
  { title: '地图探索', description: 'MapLibre GPS / Cluster / Heatmap' },
]

const heroTiles = [
  {
    id: 'tile-masonry',
    title: 'Masonry Flow',
    subtitle: '自适应列 · Blurhash 过渡',
    badge: 'GPU',
    className: 'col-span-2 row-span-2',
    gradient:
      'linear-gradient(135deg, rgba(100,160,220,0.35), rgba(140,200,255,0.2))',
  },
  {
    id: 'tile-exif',
    title: 'EXIF',
    subtitle: 'Fujifilm Recipe · HDR',
    badge: 'metadata',
    className: 'col-span-1 row-span-1',
    gradient:
      'linear-gradient(135deg, rgba(160,140,200,0.35), rgba(200,180,255,0.2))',
  },
  {
    id: 'tile-map',
    title: 'Map Explorer',
    subtitle: 'GPS Cluster / Heatmap',
    badge: 'MapLibre',
    className: 'col-span-1 row-span-2',
    gradient:
      'linear-gradient(135deg, rgba(100,200,180,0.35), rgba(140,240,220,0.2))',
  },
  {
    id: 'tile-viewer',
    title: 'Fullscreen Viewer',
    subtitle: 'Live Photo / 分享',
    badge: 'viewer',
    className: 'col-span-2 row-span-1',
    gradient:
      'linear-gradient(135deg, rgba(255,180,120,0.35), rgba(255,210,160,0.2))',
  },
]

export const HeroSection = () => (
  <section className="relative flex flex-col gap-12 lg:flex-row lg:items-center">
    <div className="flex flex-1 flex-col gap-8">
      <span className="text-accent/90 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm backdrop-blur">
        <i className="i-lucide-sparkles size-4" aria-hidden />
        Glassmorphic Depth Design System
      </span>

      <div className="space-y-5">
        <h1 className="text-4xl leading-tight font-semibold text-white sm:text-5xl lg:text-6xl">
          Afilmory
          <span className="via-accent block bg-gradient-to-r from-sky-300 to-purple-400 bg-clip-text text-transparent">
            让照片叙事具备科幻感
          </span>
        </h1>
        <p className="text-text-secondary max-w-2xl text-base sm:text-lg">
          以 WebGL、Motion 与 manifest 驱动的全栈照片站框架。支持增量同步、EXIF
          深度解析、MapLibre 地理探索，以及 Next.js 提供的 SEO / OG
          能力，帮你轻松打造沉浸式影像叙事。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          asChild
          className="to-accent text-background shadow-accent/30 min-w-[160px] bg-gradient-to-r from-sky-400 shadow-lg"
        >
          <Link
            href="https://afilmory.innei.in"
            target="_blank"
            rel="noreferrer"
          >
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
          className="group text-text-secondary hover:text-text inline-flex items-center gap-1.5 text-sm transition"
        >
          <span>Star on GitHub</span>
          <i className="i-lucide-arrow-up-right size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <ul className="text-text-secondary mt-4 flex flex-wrap gap-6 text-sm sm:text-base">
        {heroHighlights.map((item) => (
          <li key={item.title} className="flex items-center gap-2">
            <span className="bg-accent/70 size-2 rounded-full shadow-[0_0_12px_rgba(0,122,255,0.8)]" />
            <div>
              <p className="text-text font-medium">{item.title}</p>
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
              'group relative overflow-hidden rounded-[28px] border border-white/20 bg-white/40 p-4 text-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl',
              tile.className,
            )}
            style={{ backgroundImage: tile.gradient }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2 + index * 0.08,
              duration: 0.6,
              ease: 'easeOut',
            }}
          >
            <div className="flex items-center justify-between text-xs tracking-wide text-gray-600 uppercase">
              <span>{tile.badge}</span>
              <i
                className="i-lucide-chevrons-up size-4 text-gray-500"
                aria-hidden
              />
            </div>
            <p className="mt-6 text-lg font-semibold text-gray-900">
              {tile.title}
            </p>
            <p className="text-sm text-gray-700">{tile.subtitle}</p>
            <div className="pointer-events-none absolute inset-x-4 bottom-4 h-1 rounded-full bg-white/50 opacity-0 blur-lg transition duration-500 group-hover:opacity-100" />
          </m.div>
        ))}
      </m.div>

      <m.div
        aria-hidden
        className={clsxm(
          'absolute top-4 -right-6 w-56 rounded-3xl border border-white/20 bg-white/60 p-4 text-sm text-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
          blur['2xl'],
        )}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          window.__MANIFEST__
          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] text-cyan-700">
            hydrated
          </span>
        </div>
        <div className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed text-gray-700">
          <p>{'{ data: 2048 photos }'}</p>
          <p>{'cameras: 12 · lenses: 18'}</p>
          <p>{'blurhash: true · livePhoto: 86'}</p>
        </div>
      </m.div>

      <m.div
        aria-hidden
        className={clsxm(
          'absolute bottom-6 -left-6 w-60 rounded-3xl border border-white/20 bg-gradient-to-br from-emerald-100/60 to-white/60 p-4 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
          blur['2xl'],
        )}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <i className="i-lucide-map-pin size-4" />
          Map Explorer
        </div>
        <p className="mt-3 text-xs text-gray-700">
          242 geotagged stories online.
        </p>
        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-600">
          <span>Cluster · Heatmap</span>
          <span>↗︎ fully interactive</span>
        </div>
      </m.div>
    </div>
  </div>
)
