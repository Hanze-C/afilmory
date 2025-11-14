import { merge } from 'es-toolkit/compat'

import userConfig from './config.json'

export interface SiteConfig {
  name: string
  title: string
  description: string
  url: string
  accentColor: string
  author: Author
  social?: Social
  feed?: Feed
  map?: MapConfig
  mapStyle?: string
  mapProjection?: 'globe' | 'mercator'
}

/**
 * Map configuration - can be either:
 * - A string for a single provider: 'maplibre'
 * - An array for multiple providers in priority order: ['maplibre']
 */
type MapConfig = 'maplibre'[]

interface Feed {
  folo?: {
    challenge?: {
      feedId: string
      userId: string
    }
  }
}
interface Author {
  name: string
  url: string
  avatar?: string
}
interface Social {
  twitter?: string
  github?: string
  rss?: boolean
}

const defaultConfig: SiteConfig = {
  name: 'New Afilmory',
  title: 'New Afilmory',
  description: 'A modern photo gallery website.',
  url: 'https://afilmory.com',
  accentColor: '#007bff',
  author: {
    name: 'Afilmory',
    url: 'https://afilmory.art/',
    avatar: 'https://cdn.jsdelivr.net/gh/Afilmory/Afilmory@main/logo.jpg',
  },
}
export const siteConfig: SiteConfig = merge(defaultConfig, userConfig) as any

export default siteConfig
