import { format as utilFormat } from 'node:util'

import type { LogMessage } from '@afilmory/builder/logger/index.js'
import { setLogListener } from '@afilmory/builder/logger/index.js'

import type { DataSyncLogLevel, DataSyncProgressEmitter } from './data-sync.types'

const LEVEL_MAP: Record<string, DataSyncLogLevel> = {
  log: 'info',
  info: 'info',
  start: 'info',
  success: 'success',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
  debug: 'info',
  trace: 'info',
}

export async function runWithBuilderLogRelay<T>(
  emitter: DataSyncProgressEmitter | undefined,
  task: () => Promise<T>,
): Promise<T> {
  if (!emitter) {
    return await task()
  }

  const listener = (message: LogMessage): void => {
    forwardBuilderLog(emitter, message)
  }

  setLogListener(listener, { forwardToConsole: true })

  try {
    return await task()
  } finally {
    setLogListener(null, { forwardToConsole: true })
  }
}

function forwardBuilderLog(emitter: DataSyncProgressEmitter, message: LogMessage): void {
  const formatted = formatBuilderMessage(message)
  if (!formatted) {
    return
  }

  const level = LEVEL_MAP[message.level] ?? 'info'

  try {
    void emitter({
      type: 'log',
      payload: {
        level,
        message: formatted,
        timestamp: message.timestamp.toISOString(),
        stage: null,
        storageKey: undefined,
        details: {
          source: 'builder',
          tag: message.tag,
        },
      },
    })
  } catch {
    // Relay should never break builder logging
  }
}

function formatBuilderMessage(message: LogMessage): string {
  const prefix = message.tag ? `[${message.tag}] ` : ''

  if (!message.args?.length) {
    return prefix.trim()
  }

  try {
    return `${prefix}${utilFormat(...message.args)}`.trim()
  } catch {
    const fallback = message.args[0] ? String(message.args[0]) : ''
    return `${prefix}${fallback}`.trim()
  }
}
