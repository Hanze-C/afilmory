import { Spring } from '@afilmory/utils'
import { m } from 'motion/react'

import { BuilderSettingsForm } from '~/modules/builder-settings'

export function Component() {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={Spring.presets.smooth}
      className="space-y-6"
    >
      <header className="space-y-2">
        <h1 className="text-text text-2xl font-semibold">构建器设置</h1>
        <p className="text-text-secondary text-sm">调整照片构建任务的并发、日志输出与仓库同步策略。</p>
      </header>

      <BuilderSettingsForm />
    </m.div>
  )
}
