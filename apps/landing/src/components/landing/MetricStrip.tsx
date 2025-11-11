'use client'

import { m } from 'motion/react'

import { blur, radius, shadows } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

import { MetricCard } from './Card'

const metrics = [
  { label: 'WebGL 渲染', value: '60fps', detail: '平移 · 缩放 · HDR' },
  { label: '增量同步', value: 'S3 · GitHub', detail: '多存储后端' },
  { label: '照片节点', value: '2k+', detail: 'EXIF · Live Photo · Blurhash' },
  { label: '多语言', value: '11', detail: 'i18n · 动态 OG' },
]

export const MetricStrip = () => (
  <section>
    <m.div
      className={clsxm(
        'grid gap-4 border border-white/15 bg-white/40 p-6 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4',
        radius['2xl'],
        blur.xl,
        shadows.medium,
      )}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          detail={metric.detail}
        />
      ))}
    </m.div>
  </section>
)
