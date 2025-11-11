'use client'

import { useEffect } from 'react'

import { NormalContainer } from '~/components/layout/container/Normal'
import { Button } from '~/components/ui/button'

export default ({ error, reset }: any) => {
  useEffect(() => {
    console.error('error', error)
    // captureException(error)
  }, [error])

  return (
    <NormalContainer>
      <div className="center flex min-h-[calc(100vh-10rem)] flex-col">
        <h2 className="mb-5">Something went wrong!</h2>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </NormalContainer>
  )
}
