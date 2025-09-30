import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { Thumbhash } from '~/components/ui/thumbhash'
import { decodeAvifToImageData, isAvifSource } from '~/lib/avif-decoder'
import { clsxm } from '~/lib/cn'

export interface LazyImageProps {
  src: string
  alt: string
  thumbHash?: string | null
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  // Intersection observer options
  rootMargin?: string
  threshold?: number
}

export const LazyImage = ({
  src,
  alt,
  thumbHash,
  className,
  style,
  onLoad,
  onError,
  rootMargin = '50px',
  threshold = 0.1,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [decodeFailed, setDecodeFailed] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  const isAvif = useMemo(() => isAvifSource(src), [src])

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin,
    threshold,
  })

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  const shouldLoadImage = inView && !hasError

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
    setObjectUrl(null)
    setDecodeFailed(false)
  }, [src])

  useEffect(() => {
    if (!isAvif || !shouldLoadImage || objectUrl || decodeFailed) {
      return
    }

    let cancelled = false
    const controller = new AbortController()

    const decode = async () => {
      try {
        const response = await fetch(src, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const buffer = await response.arrayBuffer()
        const imageData = await decodeAvifToImageData(buffer)

        if (cancelled) {
          return
        }

        const url = await imageDataToObjectUrl(imageData)
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }

        setObjectUrl(url)
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error('Failed to decode AVIF image', error)
        setDecodeFailed(true)
      }
    }

    decode()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [decodeFailed, isAvif, objectUrl, shouldLoadImage, src])

  useEffect(() => {
    if (objectUrlRef.current && objectUrlRef.current !== objectUrl) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    objectUrlRef.current = objectUrl

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [objectUrl])

  return (
    <div
      ref={ref}
      className={clsxm('relative overflow-hidden', className)}
      style={style}
    >
      {/* Thumbhash placeholder */}
      {thumbHash && !isLoaded && (
        <Thumbhash
          thumbHash={thumbHash}
          className="absolute inset-0 scale-110 blur-sm"
        />
      )}

      {/* Actual image */}
      {shouldLoadImage && (!isAvif || objectUrl || decodeFailed) && (
        <img
          src={isAvif ? (objectUrl ?? src) : src}
          alt={alt}
          className={clsxm(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Failed to load image
          </span>
        </div>
      )}
    </div>
  )
}

async function imageDataToObjectUrl(imageData: ImageData): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文')
  }

  ctx.putImageData(imageData, 0, 0)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value)
      } else {
        reject(new Error('Canvas toBlob 失败'))
      }
    }, 'image/png')
  })

  return URL.createObjectURL(blob)
}
