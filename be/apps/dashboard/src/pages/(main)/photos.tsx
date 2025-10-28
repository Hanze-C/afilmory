import { Button } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { m } from 'motion/react'

import {
  MainPageLayout,
  useMainPageLayout,
} from '~/components/layouts/MainPageLayout'

const UploadPhotosAction = () => {
  const { headerActionState } = useMainPageLayout()
  const isBusy = headerActionState.loading
  const isDisabled = headerActionState.disabled || isBusy

  return (
    <Button
      type="button"
      disabled={isDisabled}
      isLoading={isBusy}
      loadingText="Uploading…"
      variant="primary"
      size="sm"
      aria-busy={isBusy}
    >
      Upload Photos
    </Button>
  )
}

export const Component = () => {
  return (
    <MainPageLayout
      title="Photos"
      description="Manage and organize your photo collection"
    >
      <MainPageLayout.Actions>
        <UploadPhotosAction />
      </MainPageLayout.Actions>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <m.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...Spring.presets.smooth, delay: index * 0.05 }}
            className="group bg-background-tertiary relative aspect-square overflow-hidden transition-all"
          >
            {/* Gradient borders */}
            <div className="via-text/20 group-hover:via-text/40 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent transition-opacity" />
            <div className="via-text/20 group-hover:via-text/40 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent transition-opacity" />
            <div className="via-text/20 group-hover:via-text/40 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent transition-opacity" />
            <div className="via-text/20 group-hover:via-text/40 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent transition-opacity" />

            <div className="text-text-tertiary flex h-full items-center justify-center text-[13px]">
              Photo {index + 1}
            </div>
          </m.div>
        ))}
      </div>
    </MainPageLayout>
  )
}
