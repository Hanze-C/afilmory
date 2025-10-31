import os from 'node:os'

import thumbnailStoragePlugin from '../plugins/thumbnail-storage/index.js'
import type { BuilderConfig } from '../types/config.js'

export function createDefaultBuilderConfig(): BuilderConfig {
  return {
    repo: {
      enable: false,
      url: process.env.BUILDER_REPO_URL || '',
      token: process.env.GIT_TOKEN,
    },
    storage: {
      provider: 's3',
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      prefix: process.env.S3_PREFIX,
      customDomain: process.env.S3_CUSTOM_DOMAIN,
      excludeRegex: process.env.S3_EXCLUDE_REGEX,
      maxFileLimit: process.env.S3_MAX_FILE_LIMIT ? Number.parseInt(process.env.S3_MAX_FILE_LIMIT, 10) : 1000,
      keepAlive: true,
      maxSockets: 64,
      connectionTimeoutMs: 5_000,
      socketTimeoutMs: 30_000,
      requestTimeoutMs: 20_000,
      idleTimeoutMs: 10_000,
      totalTimeoutMs: 60_000,
      retryMode: 'standard',
      maxAttempts: 3,
      downloadConcurrency: 16,
    },
    options: {
      defaultConcurrency: 10,
      enableLivePhotoDetection: true,
      showProgress: true,
      showDetailedStats: true,
      digestSuffixLength: 0,
    },
    logging: {
      verbose: false,
      level: 'info',
      outputToFile: false,
    },
    performance: {
      worker: {
        workerCount: os.cpus().length * 2,
        timeout: 30_000,
        useClusterMode: true,
        workerConcurrency: 2,
      },
    },
    plugins: [thumbnailStoragePlugin()],
  }
}
