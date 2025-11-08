import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { PhotoManifestItem } from '@afilmory/builder'
import { BizException, ErrorCode } from 'core/errors'
import type { Context } from 'hono'
import type { SatoriOptions } from 'satori'
import { injectable } from 'tsyringe'

import { ManifestService } from '../manifest/manifest.service'
import { SiteSettingService } from '../site-setting/site-setting.service'
import GeistMedium from './assets/Geist-Medium.ttf.ts'
import PingFangSC from './assets/PingFangSC.ttf.ts'
import { renderOgImage } from './og.renderer'
import type { ExifInfo, FrameDimensions } from './og.template'

const CACHE_CONTROL = 'public, max-age=31536000, stale-while-revalidate=31536000'
const LOCAL_THUMBNAIL_ROOT_CANDIDATES = [
  resolve(process.cwd(), 'dist/static/web'),
  resolve(process.cwd(), '../dist/static/web'),
  resolve(process.cwd(), '../../dist/static/web'),
  resolve(process.cwd(), 'static/web'),
  resolve(process.cwd(), '../static/web'),
  resolve(process.cwd(), '../../static/web'),
  resolve(process.cwd(), 'apps/web/dist'),
  resolve(process.cwd(), '../apps/web/dist'),
  resolve(process.cwd(), '../../apps/web/dist'),
  resolve(process.cwd(), 'apps/web/public'),
  resolve(process.cwd(), '../apps/web/public'),
  resolve(process.cwd(), '../../apps/web/public'),
]

interface ThumbnailCandidateResult {
  buffer: Buffer
  contentType: string
}

@injectable()
export class OgService {
  private fontConfig: SatoriOptions['fonts'] | null = null
  private localThumbnailRoots: string[] | null = null

  constructor(
    private readonly manifestService: ManifestService,
    private readonly siteSettingService: SiteSettingService,
  ) {}

  async render(context: Context, photoId: string): Promise<Response> {
    const manifest = await this.manifestService.getManifest()
    const photo = manifest.data.find((entry) => entry.id === photoId)
    if (!photo) {
      throw new BizException(ErrorCode.COMMON_NOT_FOUND, { message: 'Photo not found' })
    }

    const siteConfig = await this.siteSettingService.getSiteConfig()
    const formattedDate = this.formatDate(photo.exif?.DateTimeOriginal ?? photo.lastModified)
    const exifInfo = this.buildExifInfo(photo)
    const frame = this.computeFrameDimensions(photo)
    const tags = (photo.tags ?? []).slice(0, 3)
    const thumbnailSrc = await this.resolveThumbnailSrc(context, photo)

    const png = await renderOgImage({
      template: {
        photoTitle: photo.title || photo.id || 'Untitled Photo',
        photoDescription: photo.description || siteConfig.name || siteConfig.title || '',
        tags,
        formattedDate,
        exifInfo,
        thumbnailSrc,
        frame,
        photoId: photo.id,
      },
      fonts: await this.getFontConfig(),
    })
    const headers = new Headers({
      'content-type': 'image/png',
      'cache-control': CACHE_CONTROL,
      'cloudflare-cdn-cache-control': CACHE_CONTROL,
    })

    const body = this.toArrayBuffer(png)

    return new Response(body, { status: 200, headers })
  }

  private async getFontConfig(): Promise<SatoriOptions['fonts']> {
    if (this.fontConfig) {
      return this.fontConfig
    }

    this.fontConfig = [
      {
        name: 'Geist',
        data: this.toArrayBuffer(GeistMedium),
        style: 'normal',
        weight: 400,
      },
      {
        name: 'SF Pro Display',
        data: this.toArrayBuffer(PingFangSC),
        style: 'normal',
        weight: 400,
      },
    ]

    return this.fontConfig
  }

  private toArrayBuffer(source: ArrayBufferView): ArrayBuffer {
    const { buffer, byteOffset, byteLength } = source

    if (buffer instanceof ArrayBuffer) {
      return buffer.slice(byteOffset, byteOffset + byteLength)
    }

    const copy = new ArrayBuffer(byteLength)
    const view = new Uint8Array(buffer, byteOffset, byteLength)
    new Uint8Array(copy).set(view)

    return copy
  }

  private formatDate(input?: string | null): string | undefined {
    if (!input) {
      return undefined
    }

    const timestamp = Date.parse(input)
    if (Number.isNaN(timestamp)) {
      return undefined
    }

    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  private buildExifInfo(photo: PhotoManifestItem): ExifInfo | null {
    const { exif } = photo
    if (!exif) {
      return null
    }

    const focalLength = exif.FocalLengthIn35mmFormat || exif.FocalLength
    const aperture = exif.FNumber ? `f/${exif.FNumber}` : null
    const iso = exif.ISO ?? null
    const shutterSpeed = exif.ExposureTime ? `${exif.ExposureTime}s` : null
    const camera =
      exif.Make && exif.Model ? `${exif.Make.trim()} ${exif.Model.trim()}`.trim() : (exif.Model ?? exif.Make ?? null)

    if (!focalLength && !aperture && !iso && !shutterSpeed && !camera) {
      return null
    }

    return {
      focalLength: focalLength ?? null,
      aperture,
      iso,
      shutterSpeed,
      camera,
    }
  }

  private computeFrameDimensions(photo: PhotoManifestItem): FrameDimensions {
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

  private async resolveThumbnailSrc(context: Context, photo: PhotoManifestItem): Promise<string | null> {
    const normalized = this.normalizeThumbnailPath(photo.thumbnailUrl)
    if (!normalized) {
      return null
    }

    const fetched = await this.fetchThumbnailBuffer(context, normalized)
    if (!fetched) {
      return null
    }

    return this.bufferToDataUrl(fetched.buffer, fetched.contentType)
  }

  private normalizeThumbnailPath(value?: string | null): string | null {
    if (!value) {
      return null
    }

    const replaced = value.replace(/\.webp$/i, '.jpg')
    return replaced
  }

  private async fetchThumbnailBuffer(
    context: Context,
    thumbnailPath: string,
  ): Promise<ThumbnailCandidateResult | null> {
    const requests = this.buildThumbnailUrlCandidates(context, thumbnailPath)
    for (const candidate of requests) {
      const fetched = await this.tryFetchUrl(candidate)
      if (fetched) {
        return fetched
      }
    }

    const local = await this.tryReadLocalThumbnail(thumbnailPath)
    if (local) {
      return {
        buffer: local,
        contentType: 'image/jpeg',
      }
    }

    return null
  }

  private async tryFetchUrl(url: string): Promise<ThumbnailCandidateResult | null> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        return null
      }
      const arrayBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') ?? 'image/jpeg'
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
      }
    } catch {
      return null
    }
  }

  private async tryReadLocalThumbnail(thumbnailPath: string): Promise<Buffer | null> {
    const roots = await this.getLocalThumbnailRoots()
    if (roots.length === 0) {
      return null
    }

    const normalizedPath = thumbnailPath.startsWith('/') ? thumbnailPath.slice(1) : thumbnailPath
    const candidates = [normalizedPath]
    if (!normalizedPath.startsWith('static/web/')) {
      candidates.push(`static/web/${normalizedPath}`)
    }

    for (const root of roots) {
      for (const candidate of candidates) {
        try {
          const absolute = resolve(root, candidate)
          return await readFile(absolute)
        } catch {
          continue
        }
      }
    }

    return null
  }

  private async getLocalThumbnailRoots(): Promise<string[]> {
    if (this.localThumbnailRoots) {
      return this.localThumbnailRoots
    }

    const resolved: string[] = []
    for (const candidate of LOCAL_THUMBNAIL_ROOT_CANDIDATES) {
      try {
        const stats = await stat(candidate)
        if (stats.isDirectory()) {
          resolved.push(candidate)
        }
      } catch {
        continue
      }
    }

    this.localThumbnailRoots = resolved
    return resolved
  }

  private buildThumbnailUrlCandidates(context: Context, thumbnailPath: string): string[] {
    const result: string[] = []
    const externalOverride = process.env.OG_THUMBNAIL_ORIGIN?.trim()
    const normalizedPath = thumbnailPath.startsWith('/') ? thumbnailPath : `/${thumbnailPath}`

    if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
      result.push(thumbnailPath)
    } else {
      const base = this.resolveBaseUrl(context)
      if (base) {
        result.push(new URL(normalizedPath, base).toString())
        if (!normalizedPath.startsWith('/static/web/')) {
          result.push(new URL(`/static/web${normalizedPath}`, base).toString())
        }
      }

      if (externalOverride) {
        result.push(`${externalOverride.replace(/\/+$/, '')}${normalizedPath}`)
      }
    }

    return Array.from(new Set(result))
  }

  private resolveBaseUrl(context: Context): URL | null {
    const forwardedHost = context.req.header('x-forwarded-host')
    const forwardedProto = context.req.header('x-forwarded-proto')
    const host = forwardedHost ?? context.req.header('host')

    if (host) {
      const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https')
      try {
        return new URL(`${protocol}://${host}`)
      } catch {
        return null
      }
    }

    try {
      return new URL(context.req.url)
    } catch {
      return null
    }
  }

  private bufferToDataUrl(buffer: Buffer, contentType: string): string {
    return `data:${contentType};base64,${buffer.toString('base64')}`
  }
}
