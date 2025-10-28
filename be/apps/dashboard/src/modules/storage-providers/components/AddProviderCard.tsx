import { clsxm, Spring } from '@afilmory/utils'
import { DynamicIcon } from 'lucide-react/dynamic'
import { m } from 'motion/react'
import type { FC } from 'react'

type AddProviderCardProps = {
  onClick: () => void
}

export const AddProviderCard: FC<AddProviderCardProps> = ({ onClick }) => {
  return (
    <m.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={Spring.presets.smooth}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsxm(
        'group relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-background-tertiary p-5 transition-all duration-200',
        'hover:shadow-lg',
        'min-h-[180px]',
      )}
    >
      {/* Linear gradient borders with accent color on hover */}
      <div className="via-text/20 group-hover:via-accent/60 absolute top-0 right-0 left-0 h-[0.5px] bg-linear-to-r from-transparent to-transparent transition-opacity" />
      <div className="via-text/20 group-hover:via-accent/60 absolute top-0 right-0 bottom-0 w-[0.5px] bg-linear-to-b from-transparent to-transparent transition-opacity" />
      <div className="via-text/20 group-hover:via-accent/60 absolute right-0 bottom-0 left-0 h-[0.5px] bg-linear-to-r from-transparent to-transparent transition-opacity" />
      <div className="via-text/20 group-hover:via-accent/60 absolute top-0 bottom-0 left-0 w-[0.5px] bg-linear-to-b from-transparent to-transparent transition-opacity" />

      {/* Icon */}
      <div className="relative">
        <div className="border-accent/30 bg-accent/5 group-hover:border-accent/60 group-hover:bg-accent/10 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200">
          <DynamicIcon
            name="plus"
            className="text-accent h-6 w-6 transition-transform duration-200 group-hover:scale-110"
          />
        </div>
      </div>

      {/* Text */}
      <div className="relative text-center">
        <p className="text-text text-sm font-semibold">Add Provider</p>
        <p className="text-text-tertiary text-xs">Configure a new storage</p>
      </div>
    </m.button>
  )
}
