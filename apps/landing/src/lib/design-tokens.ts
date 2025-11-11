/**
 * 设计系统 - 统一的视觉 Token
 * 基于 Pastel Palette + Glassmorphic Depth Design System
 */

/**
 * 阴影层级系统
 * 针对浅色背景优化，使用极简阴影
 */
export const shadows = {
  subtle: 'shadow-none',
  light: 'shadow-none',
  medium: 'shadow-none',
  strong: 'shadow-none',
  heavy: 'shadow-none',
} as const

/**
 * 圆角系统
 */
export const radius = {
  sm: 'rounded-xl', // 12px
  md: 'rounded-2xl', // 16px
  lg: 'rounded-3xl', // 24px
  xl: 'rounded-[28px]',
  '2xl': 'rounded-[32px]',
  '3xl': 'rounded-[40px]',
} as const

/**
 * 模糊度系统
 */
export const blur = {
  sm: 'backdrop-blur-sm', // 4px
  md: 'backdrop-blur-md', // 12px
  lg: 'backdrop-blur-lg', // 16px
  xl: 'backdrop-blur-xl', // 24px
  '2xl': 'backdrop-blur-2xl', // 40px
  '3xl': 'backdrop-blur-[60px]',
} as const

/**
 * Glassmorphic 卡片基础样式
 * 统一的玻璃态卡片样式，可通过 variant 调整
 */
export const glassCard = {
  // 默认浮动卡片
  default: 'bg-background/60 border border-border backdrop-blur-xl',
  // 强调卡片（略微透明）
  elevated: 'bg-background/80 border border-border backdrop-blur-2xl',
  // 悬浮面板
  floating: 'bg-background/50 border border-white/10 backdrop-blur-[30px]',
  // 带渐变的特殊卡片
  gradient: 'border border-white/15 backdrop-blur-2xl',
} as const

/**
 * 内阴影样式（用于内陷效果）
 */
export const innerShadow = {
  subtle: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  medium: 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
  strong: 'shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]',
} as const

/**
 * 发光效果（用于强调元素）
 */
export const glow = {
  accent: 'shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.5)]',
  accentStrong: 'shadow-[0_0_24px_rgba(var(--color-accent-rgb),0.7)]',
} as const

/**
 * 过渡动画
 */
export const transition = {
  fast: 'transition-all duration-200 ease-out',
  normal: 'transition-all duration-300 ease-out',
  slow: 'transition-all duration-500 ease-out',
} as const

/**
 * Hover 状态样式
 */
export const hover = {
  card: 'hover:border-accent/30 hover:bg-background/90 transition-all duration-300',
  lift: 'hover:scale-[1.02] hover:shadow-strong transition-all duration-300',
  glow: 'hover:shadow-[0_0_24px_rgba(var(--color-accent-rgb),0.3)] transition-all duration-300',
} as const

/**
 * 间距系统（gap/space）
 */
export const spacing = {
  section: 'space-y-20', // section 之间
  content: 'space-y-12', // 内容组之间
  group: 'space-y-6', // 组内元素
  tight: 'space-y-3', // 紧密元素
} as const

/**
 * Typography 层级
 */
export const typography = {
  hero: 'text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight',
  h1: 'text-3xl lg:text-4xl font-semibold',
  h2: 'text-2xl lg:text-3xl font-semibold',
  h3: 'text-xl lg:text-2xl font-semibold',
  body: 'text-base',
  small: 'text-sm',
  tiny: 'text-xs',
  label: 'text-xs tracking-[0.3em] uppercase font-semibold',
} as const

/**
 * 图标容器样式
 */
export const iconBox = {
  sm: 'flex size-8 items-center justify-center rounded-xl bg-accent/10 text-accent',
  md: 'flex size-10 items-center justify-center rounded-2xl bg-accent/15 text-accent',
  lg: 'flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent',
} as const
