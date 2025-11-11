'use client'

import { spacing, typography } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

import { FeatureCard } from './Card'

const featureGroups = [
  {
    icon: 'i-lucide-sparkles',
    title: '精美展示',
    description: '瀑布流布局自动适配，让每张照片都以最佳方式呈现',
    bullets: [
      '智能排版算法，完美利用屏幕空间',
      '流畅的加载动画，媲美专业杂志',
      '支持高清大图，不损失画质细节',
    ],
  },
  {
    icon: 'i-lucide-image',
    title: '照片管理',
    description: '自动识别相机信息，保留每张照片背后的故事',
    bullets: [
      '自动读取相机型号、镜头和拍摄参数',
      '支持 Apple Live Photo 动态照片',
      '记录拍摄地点，在地图上回顾旅程',
    ],
  },
  {
    icon: 'i-lucide-share-2',
    title: '便捷分享',
    description: '一键生成分享链接，让更多人看到你的作品',
    bullets: [
      '精美的社交媒体预览卡片',
      '支持单张照片快速分享',
      '自动生成作品集展示页面',
    ],
  },
  {
    icon: 'i-lucide-zap',
    title: '快速搭建',
    description: '无需编程知识，5分钟即可拥有专业摄影网站',
    bullets: [
      '提供详细的使用文档和教程',
      '支持多种部署方式，完全免费',
      '持续更新优化，长期维护支持',
    ],
  },
]

export const FeatureSection = () => (
  <section className={spacing.content}>
    <header className={spacing.tight}>
      <p className="text-text-secondary text-sm font-semibold tracking-[0.3em] uppercase">
        为什么选择 Afilmory
      </p>
      <h2 className={clsxm(typography.h1, 'text-white')}>
        让你的作品得到应有的关注
      </h2>
      <p className="text-text-secondary max-w-3xl text-base">
        专为摄影师设计，无论你是专业摄影师还是摄影爱好者，都能轻松打造属于自己的作品展示空间。
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
