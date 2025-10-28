import {
  STORAGE_PROVIDER_FIELD_DEFINITIONS,
  STORAGE_PROVIDER_TYPES,
} from './constants'
import type { StorageProvider, StorageProviderType } from './types'

const generateId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

export const isStorageProviderType = (
  value: unknown,
): value is StorageProviderType => {
  return STORAGE_PROVIDER_TYPES.includes(value as StorageProviderType)
}

const normaliseConfigForType = (
  type: StorageProviderType,
  config: Record<string, unknown>,
): Record<string, string> => {
  return STORAGE_PROVIDER_FIELD_DEFINITIONS[type].reduce<
    Record<string, string>
  >((acc, field) => {
    const raw = config[field.key]
    acc[field.key] =
      typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
    return acc
  }, {})
}

const coerceProvider = (input: unknown): StorageProvider | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null
  }

  const record = input as Record<string, unknown>
  const type = isStorageProviderType(record.type) ? record.type : 'local'
  const configInput =
    record.config &&
    typeof record.config === 'object' &&
    !Array.isArray(record.config)
      ? (record.config as Record<string, unknown>)
      : {}

  const provider: StorageProvider = {
    id:
      typeof record.id === 'string' && record.id.trim().length > 0
        ? record.id.trim()
        : generateId(),
    name:
      typeof record.name === 'string' && record.name.trim().length > 0
        ? record.name.trim()
        : '未命名存储',
    type,
    config: normaliseConfigForType(type, configInput),
  }

  if (typeof record.createdAt === 'string') {
    provider.createdAt = record.createdAt
  }

  if (typeof record.updatedAt === 'string') {
    provider.updatedAt = record.updatedAt
  }

  return provider
}

export const parseStorageProviders = (
  raw: string | null,
): StorageProvider[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => coerceProvider(item))
      .filter((item): item is StorageProvider => item !== null)
  } catch {
    return []
  }
}

export const serializeStorageProviders = (
  providers: ReadonlyArray<StorageProvider>,
): string => {
  return JSON.stringify(
    providers.map((provider) => ({
      ...provider,
      config: normaliseConfigForType(provider.type, provider.config),
    })),
  )
}

export const getDefaultConfigForType = (
  type: StorageProviderType,
): Record<string, string> => {
  return STORAGE_PROVIDER_FIELD_DEFINITIONS[type].reduce<
    Record<string, string>
  >((acc, field) => {
    acc[field.key] = ''
    return acc
  }, {})
}

export const createEmptyProvider = (
  type: StorageProviderType,
): StorageProvider => {
  const timestamp = new Date().toISOString()
  return {
    id: '',
    name: '未命名存储',
    type,
    config: getDefaultConfigForType(type),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const ensureActiveProviderId = (
  providers: ReadonlyArray<StorageProvider>,
  activeId: string | null,
): string | null => {
  if (!activeId) {
    return null
  }

  return providers.some((provider) => provider.id === activeId)
    ? activeId
    : null
}

export const reorderProvidersByActive = (
  providers: ReadonlyArray<StorageProvider>,
  activeId: string | null,
): StorageProvider[] => {
  if (!activeId) {
    return [...providers]
  }

  return [...providers].sort((a, b) => {
    if (a.id === activeId) return -1
    if (b.id === activeId) return 1
    return a.name.localeCompare(b.name, 'zh-cn')
  })
}
