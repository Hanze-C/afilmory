import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { injectable } from 'tsyringe'

import { SiteSettingService } from '../site-setting/site-setting.service'
import type { StaticAssetDocument } from './static-asset.service'
import { StaticAssetService } from './static-asset.service'
import { StaticWebManifestService } from './static-web-manifest.service'

const STATIC_ROOT_ENV = process.env.STATIC_WEB_ROOT?.trim()

const MODULE_DIR = fileURLToPath(new URL('.', import.meta.url))

const STATIC_WEB_ROUTE_SEGMENT = '/static/web'

const STATIC_WEB_ROOT_CANDIDATES = Array.from(
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

const STATIC_WEB_ASSET_LINK_RELS = [
  'stylesheet',
  'modulepreload',
  'preload',
  'prefetch',
  'icon',
  'shortcut icon',
  'apple-touch-icon',
  'manifest',
]

@injectable()
export class StaticWebService extends StaticAssetService {
  constructor(
    private readonly manifestService: StaticWebManifestService,
    private readonly siteSettingService: SiteSettingService,
  ) {
    super({
      routeSegment: STATIC_WEB_ROUTE_SEGMENT,
      rootCandidates: STATIC_WEB_ROOT_CANDIDATES,
      assetLinkRels: STATIC_WEB_ASSET_LINK_RELS,
      loggerName: 'StaticWebService',
    })
  }

  protected override async decorateDocument(document: StaticAssetDocument): Promise<void> {
    await this.injectConfigScript(document)
    await this.injectManifestScript(document)
  }

  private async injectConfigScript(document: StaticAssetDocument): Promise<void> {
    const configScript = document.head?.querySelector('#config')
    if (!configScript) {
      return
    }

    const payload = JSON.stringify({
      useCloud: true,
    })
    const tenantSiteConfig = await this.siteSettingService.getSiteConfig()
    const siteConfigPayload = JSON.stringify(tenantSiteConfig)
    configScript.textContent = `window.__CONFIG__ = ${payload};window.__SITE_CONFIG__ = ${siteConfigPayload}`
  }

  private async injectManifestScript(document: StaticAssetDocument): Promise<void> {
    const manifestScript = document.head?.querySelector('#manifest')
    if (!manifestScript) {
      return
    }

    const manifest = await this.manifestService.getManifest()
    manifestScript.textContent = `window.__MANIFEST__ = ${JSON.stringify(manifest)};`
  }
}
