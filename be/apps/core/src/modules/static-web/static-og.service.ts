import type { PhotoManifestItem } from '@afilmory/builder'
import { createLogger } from '@afilmory/framework'
import { ImageResponse } from '@vercel/og'
import type { Context } from 'hono'
import { injectable } from 'tsyringe'

import geistFont from '../../../../../../apps/ssr/src/app/og/[photoId]/Geist-Medium.ttf.ts'
import sansFont from '../../../../../../apps/ssr/src/app/og/[photoId]/PingFangSC.ttf.ts'
import { siteConfig } from '../../../../../../site.config'
import { StaticWebManifestService } from './static-web-manifest.service'

const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 628

type OgElement = {
  type: string
  props: Record<string, unknown>
}

interface ExifInfo {
  focalLength?: string | null
  aperture?: string | null
  iso?: string | number | null
  shutterSpeed?: string | null
  camera?: string | null
}

interface LayoutMetrics {
  frameWidth: number
  frameHeight: number
  imageAreaWidth: number
  imageAreaHeight: number
  displayWidth: number
  displayHeight: number
}

interface OgTemplateContext {
  photo: PhotoManifestItem
  formattedDate: string
  tags: string[]
  exifInfo: ExifInfo | null
  layout: LayoutMetrics
  thumbnailBuffer?: ArrayBuffer
}

@injectable()
export class StaticOgService {
  private readonly logger = createLogger('StaticOgService')
  private fontDataPromise?: Promise<{ geist: ArrayBuffer; sans: ArrayBuffer }>

  constructor(private readonly manifestService: StaticWebManifestService) {}

  async render(context: Context, photoId: string): Promise<Response> {
    const manifest = await this.manifestService.getManifest()
    const photo = manifest.data.find((item) => item.id === photoId)

    if (!photo) {
      return new Response('Photo not found', { status: 404 })
    }

    try {
      const [{ geist, sans }, template] = await Promise.all([
        this.loadFonts(),
        this.buildTemplateContext(context, photo),
      ])

      const element = this.renderTemplate(template)

      return new ImageResponse(element as unknown as OgElement, {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        emoji: 'noto',
        fonts: [
          {
            name: 'Geist',
            data: geist,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'SF Pro Display',
            data: sans,
            style: 'normal',
            weight: 400,
          },
        ],
        headers: {
          'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=31536000',
          'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, stale-while-revalidate=31536000',
        },
      })
    } catch (error) {
      this.logger.error('Failed to generate OG image', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return new Response(`Failed to generate image, ${message}`, {
        status: 500,
      })
    }
  }

  private async buildTemplateContext(context: Context, photo: PhotoManifestItem): Promise<OgTemplateContext> {
    const formattedDate = this.formatDate(photo)
    const exifInfo = this.formatExifInfo(photo)
    const layout = this.calculateLayout(photo)
    const tags = photo.tags?.slice(0, 3) ?? []

    const thumbnailBuffer = photo.thumbnailUrl
      ? await this.fetchThumbnailBuffer(context, photo.thumbnailUrl)
      : undefined

    return {
      photo,
      formattedDate,
      tags,
      exifInfo,
      layout,
      thumbnailBuffer,
    }
  }

  private async loadFonts(): Promise<{ geist: ArrayBuffer; sans: ArrayBuffer }> {
    if (!this.fontDataPromise) {
      this.fontDataPromise = Promise.resolve({
        geist: this.bufferToArrayBuffer(geistFont),
        sans: this.bufferToArrayBuffer(sansFont),
      })
    }

    return this.fontDataPromise
  }

  private bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  }

  private formatDate(photo: PhotoManifestItem): string {
    const dateTaken = photo.exif?.DateTimeOriginal || photo.lastModified
    if (!dateTaken) {
      return ''
    }

    const timestamp = Date.parse(dateTaken)
    if (Number.isNaN(timestamp)) {
      return ''
    }

    return new Date(timestamp).toLocaleDateString('en-US')
  }

  private formatExifInfo(photo: PhotoManifestItem): ExifInfo | null {
    if (!photo.exif) {
      return null
    }

    const info: ExifInfo = {
      focalLength: photo.exif.FocalLengthIn35mmFormat || photo.exif.FocalLength || null,
      aperture: photo.exif.FNumber ? `f/${photo.exif.FNumber}` : null,
      iso: photo.exif.ISO ?? null,
      shutterSpeed: photo.exif.ExposureTime ? `${photo.exif.ExposureTime}s` : null,
      camera:
        photo.exif.Make && photo.exif.Model ? `${photo.exif.Make} ${photo.exif.Model}` : (photo.exif.Model ?? null),
    }

    return info
  }

  private calculateLayout(photo: PhotoManifestItem): LayoutMetrics {
    const imageWidth = photo.width || 1
    const imageHeight = photo.height || 1
    const aspectRatio = imageWidth / imageHeight

    const maxFrameWidth = 500
    const maxFrameHeight = 420

    let frameWidth = maxFrameWidth
    let frameHeight = maxFrameHeight

    if (aspectRatio > maxFrameWidth / maxFrameHeight) {
      frameHeight = maxFrameWidth / aspectRatio
    } else {
      frameWidth = maxFrameHeight * aspectRatio
    }

    const imageAreaWidth = frameWidth - 70
    const imageAreaHeight = frameHeight - 70

    let displayWidth = imageAreaWidth
    let displayHeight = imageAreaHeight

    if (aspectRatio > imageAreaWidth / imageAreaHeight) {
      displayHeight = imageAreaWidth / aspectRatio
    } else {
      displayWidth = imageAreaHeight * aspectRatio
    }

    return {
      frameWidth,
      frameHeight,
      imageAreaWidth,
      imageAreaHeight,
      displayWidth,
      displayHeight,
    }
  }

  private async fetchThumbnailBuffer(context: Context, thumbnailUrl: string): Promise<ArrayBuffer> {
    const normalized = thumbnailUrl.replace(/\.webp$/i, '.jpg')
    const requestUrl = new URL(context.req.url)

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return this.fetchFirstSuccessful([normalized])
    }

    const relative = normalized.startsWith('/') ? normalized : `/${normalized}`

    const candidates = new Set<string>()
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL

    candidates.add(`${requestUrl.origin}${relative}`)

    if (requestUrl.port) {
      candidates.add(`${requestUrl.protocol}//localhost:${requestUrl.port}${relative}`)
    }

    const inferredPort = requestUrl.port || process.env.PORT || '3000'
    candidates.add(`http://localhost:${inferredPort}${relative}`)
    candidates.add(`http://localhost:13333${relative}`)

    if (envAppUrl) {
      const prefix =
        envAppUrl.startsWith('http://') || envAppUrl.startsWith('https://') ? envAppUrl : `http://${envAppUrl}`
      candidates.add(`${prefix}${relative}`)
    }

    return this.fetchFirstSuccessful([...candidates])
  }

  private async fetchFirstSuccessful(urls: string[]): Promise<ArrayBuffer> {
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          continue
        }
        return await response.arrayBuffer()
      } catch (error) {
        this.logger.warn(`Failed to fetch thumbnail from ${url}`, error)
        continue
      }
    }

    throw new Error('Unable to load thumbnail image')
  }

  private renderTemplate(context: OgTemplateContext): OgElement {
    const { photo, formattedDate, tags, exifInfo, layout, thumbnailBuffer } = context

    const h = (
      type: string,
      props: Record<string, unknown> | null,
      ...children: Array<OgElement | string | null>
    ): OgElement => {
      const filteredChildren = children
        .flat()
        .filter((child): child is OgElement | string => child !== null && child !== undefined && child !== false)

      const normalizedProps: Record<string, unknown> = { ...props }

      if (filteredChildren.length > 0) {
        normalizedProps.children = filteredChildren.length === 1 ? filteredChildren[0] : filteredChildren
      }

      return {
        type,
        props: normalizedProps,
      }
    }

    const decorativeOverlays = [
      {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.03,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      },
      {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(60,60,70,0.15) 0%, rgba(40,40,50,0.08) 40%, transparent 70%)',
      },
      {
        position: 'absolute',
        bottom: '0px',
        right: '0px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,45,55,0.12) 0%, rgba(30,30,40,0.06) 50%, transparent 80%)',
      },
      {
        position: 'absolute',
        top: '5%',
        right: '25%',
        width: '180px',
        height: '480px',
        background:
          'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 60%, transparent 100%)',
        transform: 'rotate(15deg)',
      },
    ].map((style) => h('div', { style }, null))

    const filmHoles = Array.from({ length: 7 }, () =>
      h(
        'div',
        {
          style: {
            width: '10px',
            height: '10px',
            background: 'radial-gradient(circle, #000 40%, #222 70%, #333 100%)',
            borderRadius: '50%',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
          },
        },
        null,
      ),
    )

    const filmBorderStyles = [
      {
        position: 'absolute',
        top: '30%',
        right: '12%',
        width: '120px',
        height: '120px',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '5px',
        transform: 'rotate(12deg)',
      },
      {
        position: 'absolute',
        top: '35%',
        right: '15%',
        width: '90px',
        height: '90px',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '3px',
        transform: 'rotate(-8deg)',
      },
      {
        position: 'absolute',
        bottom: '25%',
        left: '12%',
        width: '72px',
        height: '72px',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '50%',
      },
    ].map((style) => h('div', { style }, null))

    const apertureDecor = h(
      'div',
      {
        style: {
          position: 'absolute',
          bottom: '40%',
          right: '8%',
          width: '48px',
          height: '48px',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      h(
        'div',
        {
          style: {
            width: '30px',
            height: '30px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        h(
          'div',
          {
            style: {
              width: '15px',
              height: '15px',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '50%',
            },
          },
          null,
        ),
      ),
    )

    const tagElements =
      tags.length > 0
        ? h(
            'div',
            {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                margin: '0 0 32px 0',
              },
            },
            ...tags.map((tag) =>
              h(
                'div',
                {
                  style: {
                    fontSize: '26px',
                    color: 'rgba(255,255,255,0.9)',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    padding: '12px 20px',
                    borderRadius: '24px',
                    letterSpacing: '0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    fontFamily: 'Geist, SF Pro Display',
                  },
                },
                `#${tag}`,
              ),
            ),
          )
        : null

    const leftFilmColumn = h(
      'div',
      {
        style: {
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '30px',
          height: '100%',
          background: 'linear-gradient(90deg, #0a0a0a 0%, #111 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: '25px',
          paddingBottom: '25px',
        },
      },
      ...filmHoles,
    )

    const rightFilmColumn = h(
      'div',
      {
        style: {
          position: 'absolute',
          right: '0px',
          top: '0px',
          width: '30px',
          height: '100%',
          background: 'linear-gradient(90deg, #111 0%, #0a0a0a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: '25px',
          paddingBottom: '25px',
        },
      },
      ...filmHoles,
    )

    const filmTexture = [
      h(
        'div',
        {
          style: {
            position: 'absolute',
            top: '0',
            left: '30px',
            width: `${layout.imageAreaWidth}px`,
            height: '30px',
            background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #1a1a1a 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          },
        },
        null,
      ),
      h(
        'div',
        {
          style: {
            position: 'absolute',
            bottom: '0',
            left: '30px',
            width: `${layout.imageAreaWidth}px`,
            height: '30px',
            background: 'linear-gradient(0deg, #1a1a1a 0%, #2a2a2a 30%, #1a1a1a 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          },
        },
        null,
      ),
    ]

    const photoFrame =
      photo.thumbnailUrl && thumbnailBuffer
        ? h(
            'div',
            {
              style: {
                position: 'absolute',
                top: '75px',
                right: '45px',
                width: `${layout.frameWidth}px`,
                height: `${layout.frameHeight}px`,
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
                borderRadius: '6px',
                border: '1px solid #2a2a2a',
                boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
                display: 'flex',
                overflow: 'hidden',
              },
            },
            leftFilmColumn,
            rightFilmColumn,
            h(
              'div',
              {
                style: {
                  position: 'absolute',
                  left: '30px',
                  top: '30px',
                  width: `${layout.imageAreaWidth}px`,
                  height: `${layout.imageAreaHeight}px`,
                  background: '#000',
                  borderRadius: '2px',
                  border: '2px solid #1a1a1a',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
                },
              },
              h(
                'div',
                {
                  style: {
                    position: 'relative',
                    width: `${layout.displayWidth}px`,
                    height: `${layout.displayHeight}px`,
                    overflow: 'hidden',
                    display: 'flex',
                  },
                },
                h(
                  'img',
                  {
                    src: thumbnailBuffer,
                    style: {
                      width: `${layout.displayWidth}px`,
                      height: `${layout.displayHeight}px`,
                      objectFit: 'cover',
                    },
                  },
                  null,
                ),
              ),
              h(
                'div',
                {
                  style: {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 25%, transparent 45%, transparent 55%, rgba(255,255,255,0.03) 75%, transparent 100%)',
                    pointerEvents: 'none',
                  },
                },
                null,
              ),
              ...filmTexture,
            ),
          )
        : null

    const footerItems: Array<OgElement | string> = []

    if (formattedDate) {
      footerItems.push(
        h(
          'div',
          {
            style: {
              fontSize: '28px',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            },
          },
          `📸 ${formattedDate}`,
        ),
      )
    }

    if (exifInfo?.camera) {
      footerItems.push(
        h(
          'div',
          {
            style: {
              fontSize: '25px',
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.3px',
              display: 'flex',
            },
          },
          `📷 ${exifInfo.camera}`,
        ),
      )
    }

    if (exifInfo && (exifInfo.aperture || exifInfo.shutterSpeed || exifInfo.iso || exifInfo.focalLength)) {
      const exifBadges: OgElement[] = []

      if (exifInfo.aperture) {
        exifBadges.push(
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '12px 18px',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              },
            },
            `⚫ ${exifInfo.aperture}`,
          ),
        )
      }

      if (exifInfo.shutterSpeed) {
        exifBadges.push(
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '12px 18px',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              },
            },
            `⏱️ ${exifInfo.shutterSpeed}`,
          ),
        )
      }

      if (exifInfo.iso) {
        exifBadges.push(
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '12px 18px',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              },
            },
            `📊 ISO ${exifInfo.iso}`,
          ),
        )
      }

      if (exifInfo.focalLength) {
        exifBadges.push(
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '12px 18px',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              },
            },
            `🔍 ${exifInfo.focalLength}`,
          ),
        )
      }

      footerItems.push(
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              fontSize: '25px',
              color: 'rgba(255,255,255,0.8)',
            },
          },
          ...exifBadges,
        ),
      )
    }

    const footer = h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '28px',
        },
      },
      ...footerItems,
    )

    return h(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background:
            'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 20%, #121212 40%, #1a1a1a 60%, #0f0f0f 80%, #0a0a0a 100%)',
          padding: '80px',
          fontFamily: 'Geist, system-ui, -apple-system, sans-serif',
          position: 'relative',
        },
      },
      ...decorativeOverlays,
      ...filmBorderStyles,
      apertureDecor,
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: '58%',
          },
        },
        h(
          'h1',
          {
            style: {
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
              lineHeight: '1.1',
              letterSpacing: '1px',
              display: 'flex',
            },
          },
          photo.title || 'Untitled Photo',
        ),
        h(
          'p',
          {
            style: {
              fontSize: '36px',
              color: 'rgba(255,255,255,0.9)',
              margin: '0 0 16px 0',
              lineHeight: '1.3',
              letterSpacing: '0.3px',
              display: 'flex',
              fontFamily: 'Geist, SF Pro Display',
            },
          },
          photo.description || siteConfig.name || siteConfig.title,
        ),
        tagElements,
      ),
      photoFrame,
      footer,
    )
  }
}
