'use client'

import { m } from 'motion/react'

import { blur, radius, shadows } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

import { MetricCard } from './Card'

const metrics = [
  { label: '流畅体验', value: '丝滑', detail: '杂志般的浏览感受' },
  { label: '多端适配', value: '响应式', detail: '手机 · 平板 · 电脑' },
  { label: '照片容量', value: '不限', detail: '支持大量照片展示' },
  { label: '完全免费', value: '开源', detail: '永久免费使用' },
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
