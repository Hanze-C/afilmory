import type { Stats } from 'node:fs'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { extname, isAbsolute, join, normalize, relative, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { createLogger } from '@afilmory/framework'
import { DOMParser } from 'linkedom'
import { lookup as lookupMimeType } from 'mime-types'
import { injectable } from 'tsyringe'

const STATIC_ROOT_ENV = process.env.STATIC_WEB_ROOT?.trim()

const MODULE_DIR = fileURLToPath(new URL('.', import.meta.url))

const STATIC_ROOT_CANDIDATES = Array.from(
  new Set(
    [
      STATIC_ROOT_ENV,
      resolve(MODULE_DIR, '../../static/web'),
      resolve(process.cwd(), 'dist/static/web'),
      resolve(process.cwd(), '../dist/static/web'),
      resolve(process.cwd(), '../../dist/static/web'),
      resolve(process.cwd(), '../../../dist/static/web'),
      resolve(process.cwd(), 'static/web'),
      resolve(process.cwd(), '../static/web'),
      resolve(process.cwd(), '../../static/web'),
      resolve(process.cwd(), '../../../static/web'),
      resolve(process.cwd(), 'apps/web/dist'),
      resolve(process.cwd(), '../apps/web/dist'),
      resolve(process.cwd(), '../../apps/web/dist'),
      resolve(process.cwd(), '../../../apps/web/dist'),
    ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0),
  ),
)

const STATIC_ROUTE_SEGMENT = '/static/web'

interface ResolvedFile {
  absolutePath: string
  relativePath: string
  stats: Stats
}

@injectable()
export class StaticWebService {
  private staticRoot: string | null | undefined
  private warnedMissingRoot = false
  private readonly logger = createLogger('StaticWebService')

  async handleRequest(fullPath: string, headOnly: boolean): Promise<Response | null> {
    const staticRoot = await this.resolveStaticRoot()
    if (!staticRoot) {
      return null
    }

    const relativeRequestPath = this.extractRelativePath(fullPath)
    const target = await this.resolveFile(relativeRequestPath, staticRoot)
    if (!target) {
      return null
    }

    return await this.createResponse(target, headOnly)
  }

  private async resolveStaticRoot(): Promise<string | null> {
    if (this.staticRoot !== undefined) {
      return this.staticRoot
    }

    for (const candidate of STATIC_ROOT_CANDIDATES) {
      try {
        const stats = await stat(candidate)
        if (stats.isDirectory()) {
          this.staticRoot = candidate
          this.logger.info(`Using static assets root: ${candidate}`)
          return candidate
        }
      } catch {
        continue
      }
    }

    this.staticRoot = null
    if (!this.warnedMissingRoot) {
      this.warnedMissingRoot = true
      this.logger.warn('No static web root found; static route will return 404')
    }

    return null
  }

  private extractRelativePath(fullPath: string): string {
    const index = fullPath.indexOf(STATIC_ROUTE_SEGMENT)
    if (index === -1) {
      return ''
    }

    const sliceStart = index + STATIC_ROUTE_SEGMENT.length
    const remainder = sliceStart < fullPath.length ? fullPath.slice(sliceStart) : ''
    return this.stripLeadingSlashes(remainder)
  }

  private stripLeadingSlashes(pathname: string): string {
    let result = pathname
    while (result.startsWith('/')) {
      result = result.slice(1)
    }
    return result
  }

  private async resolveFile(requestPath: string, root: string): Promise<ResolvedFile | null> {
    const decoded = this.decodePath(requestPath)
    const normalized = this.normalizePath(decoded)
    const candidates = this.buildCandidatePaths(normalized)

    for (const candidate of candidates) {
      const resolved = await this.tryResolveFile(root, candidate)
      if (resolved) {
        return resolved
      }
    }

    return null
  }

  private decodePath(pathname: string): string {
    if (pathname.length === 0) {
      return pathname
    }

    try {
      return decodeURIComponent(pathname)
    } catch {
      return pathname
    }
  }

  private normalizePath(pathname: string): string {
    if (pathname.length === 0) {
      return 'index.html'
    }

    const withoutLeadingSlash = this.stripLeadingSlashes(pathname)
    if (withoutLeadingSlash.length === 0) {
      return 'index.html'
    }

    return withoutLeadingSlash
  }

  private buildCandidatePaths(normalizedPath: string): string[] {
    const candidates = new Set<string>()

    const sanitized = this.removeLeadingDotSlash(normalize(normalizedPath))
    candidates.add(sanitized)

    if (sanitized.endsWith('/')) {
      candidates.add(join(sanitized, 'index.html'))
    }

    if (!this.hasFileExtension(sanitized)) {
      candidates.add('index.html')
    }

    return Array.from(candidates)
  }

  private removeLeadingDotSlash(pathname: string): string {
    let result = pathname
    while (result.startsWith('./')) {
      result = result.slice(2)
    }
    return result
  }

  private hasFileExtension(pathname: string): boolean {
    return extname(pathname) !== ''
  }

  private async tryResolveFile(root: string, relativePath: string): Promise<ResolvedFile | null> {
    const safePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
    const absolutePath = resolve(root, safePath)

    if (!this.ensureWithinRoot(root, absolutePath)) {
      return null
    }

    try {
      const stats = await stat(absolutePath)
      if (!stats.isFile()) {
        return null
      }

      return { absolutePath, relativePath: safePath, stats }
    } catch {
      return null
    }
  }

  private ensureWithinRoot(root: string, filePath: string): boolean {
    const relativePath = relative(root, filePath)
    return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath)
  }

  private async createResponse(file: ResolvedFile, headOnly: boolean): Promise<Response> {
    if (file.relativePath === 'index.html') {
      return await this.createIndexResponse(file, headOnly)
    }

    const mimeType = lookupMimeType(file.absolutePath) || 'application/octet-stream'
    const headers = new Headers()
    headers.set('content-type', mimeType)
    headers.set('content-length', `${file.stats.size}`)
    headers.set('last-modified', file.stats.mtime.toUTCString())

    this.applyCacheHeaders(headers, file.relativePath)

    if (headOnly) {
      return new Response(null, { headers, status: 200 })
    }

    const nodeStream = createReadStream(file.absolutePath)
    const body = Readable.toWeb(nodeStream) as unknown as ReadableStream
    return new Response(body, { headers, status: 200 })
  }

  private async createIndexResponse(file: ResolvedFile, headOnly: boolean): Promise<Response> {
    const html = await readFile(file.absolutePath, 'utf-8')
    const transformed = this.transformIndexHtml(html)
    const headers = new Headers()
    headers.set('content-type', 'text/html; charset=utf-8')
    headers.set('content-length', `${Buffer.byteLength(transformed, 'utf-8')}`)
    headers.set('last-modified', file.stats.mtime.toUTCString())
    this.applyCacheHeaders(headers, file.relativePath)

    if (headOnly) {
      return new Response(null, { headers, status: 200 })
    }

    return new Response(transformed, { headers, status: 200 })
  }

  private transformIndexHtml(html: string): string {
    try {
      const document = new DOMParser().parseFromString(html, 'text/html')
      const configScript = document.head?.querySelector('#config')
      if (configScript) {
        const payload = JSON.stringify({
          useCloud: true,
        })
        configScript.textContent = `window.__CONFIG__ = ${payload}`
      }
      return document.documentElement.outerHTML
    } catch (error) {
      this.logger.warn('Failed to transform index.html for static web response', error)
      return html
    }
  }

  private shouldTreatAsImmutable(relativePath: string): boolean {
    if (this.isHtml(relativePath)) {
      return false
    }

    return this.hasFileExtension(relativePath)
  }

  private applyCacheHeaders(headers: Headers, relativePath: string): void {
    const policy = this.resolveCachePolicy(relativePath)
    headers.set('cache-control', policy.browser)
    headers.set('cdn-cache-control', policy.cdn)
    headers.set('surrogate-control', policy.cdn)
  }

  private resolveCachePolicy(relativePath: string): { browser: string; cdn: string } {
    if (this.isHtml(relativePath)) {
      return {
        browser: 'no-cache',
        cdn: 'no-cache',
      }
    }

    if (this.shouldTreatAsImmutable(relativePath)) {
      return {
        browser: 'public, max-age=31536000, immutable',
        cdn: 'public, max-age=31536000, immutable',
      }
    }

    return {
      browser: 'public, max-age=3600, must-revalidate',
      cdn: 'public, max-age=86400, stale-while-revalidate=600',
    }
  }

  private isHtml(relativePath: string): boolean {
    return relativePath === 'index.html' || relativePath.endsWith('.html')
  }
}
