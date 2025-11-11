'use client'

import { BackgroundDecor } from '~/components/landing/BackgroundDecor'
import { CTASection } from '~/components/landing/CTASection'
import { FeatureSection } from '~/components/landing/FeatureSection'
import { HeroSection } from '~/components/landing/HeroSection'
import { MetricStrip } from '~/components/landing/MetricStrip'
import { PreviewSection } from '~/components/landing/PreviewSection'
import { TechSection } from '~/components/landing/TechSection'
import { WorkflowSection } from '~/components/landing/WorkflowSection'

export default function Home() {
  return (
    <div className="bg-background text-text relative isolate overflow-hidden pb-32">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pt-12 pb-16 sm:px-6 lg:px-0">
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
