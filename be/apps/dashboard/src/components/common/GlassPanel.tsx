import { clsxm } from '@afilmory/utils'
import type { ReactNode } from 'react'

export const LinearBorderPanel = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={clsxm('group relative overflow-hidden -mx-6', className)}>
    {/* Linear gradient borders - sharp edges */}
    <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />
    <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-linear-to-b from-transparent to-transparent" />
    <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />
    <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-linear-to-b from-transparent to-transparent" />

    <div className="relative">{children}</div>
  </div>
)
