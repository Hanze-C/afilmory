/**
 * 通用卡片组件 - 基于 Glassmorphic Depth Design System
 */

import type { ReactNode } from 'react'

import { glassCard, radius, shadows } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'floating' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
  gradient?: string
}

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  hoverable = false,
  gradient,
}: CardProps) => {
  return (
    <div
      className={clsxm(
        glassCard[variant],
        radius.lg,
        shadows.medium,
        sizeStyles[size],
        hoverable &&
          'hover:border-accent/30 hover:bg-background/90 transition-all duration-300',
        className,
      )}
      style={gradient ? { backgroundImage: gradient } : undefined}
    >
      {children}
    </div>
  )
}

interface IconCardProps {
  icon: string
  title: string
  description?: string
  meta?: string
  hoverable?: boolean
}

export const IconCard = ({
  icon,
  title,
  description,
  meta,
  hoverable = true,
}: IconCardProps) => {
  return (
    <Card variant="default" size="md" hoverable={hoverable} className="group">
      <div className="text-text flex items-center gap-3">
        <span className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-2xl">
          <i className={clsxm('size-5', icon)} aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-lg font-medium">{title}</p>
          {description && (
            <p className="text-text-secondary text-sm">{description}</p>
          )}
        </div>
        {meta && <span className="text-text-tertiary text-xs">{meta}</span>}
      </div>
    </Card>
  )
}

interface FeatureCardProps {
  icon: string
  title: string
  description: string
  bullets: string[]
}

export const FeatureCard = ({
  icon,
  title,
  description,
  bullets,
}: FeatureCardProps) => {
  return (
    <Card variant="floating" size="lg" className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="bg-accent/15 text-accent flex size-12 items-center justify-center rounded-2xl">
          <i className={clsxm('size-5', icon)} aria-hidden />
        </span>
        <div>
          <p className="text-xl font-semibold text-white">{title}</p>
          <p className="text-text-secondary text-sm">{description}</p>
        </div>
      </div>
      <ul className="text-text-secondary space-y-2 text-sm">
        {bullets.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <i className="i-lucide-check text-accent size-4" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

interface MetricCardProps {
  label: string
  value: string
  detail: string
}

export const MetricCard = ({ label, value, detail }: MetricCardProps) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/50 px-4 py-5 shadow-inner shadow-white/30">
      <p className="text-xs tracking-widest text-gray-600 uppercase">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-gray-700">{detail}</p>
    </div>
  )
}
