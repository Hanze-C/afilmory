import type { EagleConfig } from '../../storage/interfaces.js'
import { EagleStorageProvider } from '../../storage/providers/eagle-provider.js'
import type { BuilderPlugin } from '../types.js'

export interface EagleStoragePluginOptions {
  provider?: string
}

export default function eagleStoragePlugin(options: EagleStoragePluginOptions = {}): BuilderPlugin {
  const providerName = options.provider ?? 'eagle'

  return {
    name: `afilmory:storage:${providerName}`,
    hooks: {
      onInit: ({ registerStorageProvider }) => {
        registerStorageProvider(providerName, (config) => {
          return new EagleStorageProvider(config as EagleConfig)
        })
      },
    },
  }
}
