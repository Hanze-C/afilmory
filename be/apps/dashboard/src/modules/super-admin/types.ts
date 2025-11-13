import type { PhotoManifestItem } from '@afilmory/builder'

import type { PhotoSyncLogLevel } from '../photos/types'
import type { SchemaFormValue, UiSchema } from '../schema-form/types'

export type SuperAdminSettingField = string

export type SuperAdminSettings = Record<SuperAdminSettingField, SchemaFormValue | undefined>

export interface SuperAdminStats {
  totalUsers: number
  registrationsRemaining: number | null
}

type SuperAdminSettingsResponseShape = {
  schema: UiSchema<SuperAdminSettingField>
  stats: SuperAdminStats
}

export type SuperAdminSettingsResponse =
  | (SuperAdminSettingsResponseShape & {
      values: SuperAdminSettings
      settings?: never
    })
  | (SuperAdminSettingsResponseShape & {
      settings: SuperAdminSettings
      values?: never
    })

export type UpdateSuperAdminSettingsPayload = Partial<
  Record<SuperAdminSettingField, SchemaFormValue | null | undefined>
>

export type BuilderDebugProgressEvent =
  | {
      type: 'start'
      payload: {
        storageKey: string
        filename: string
        contentType: string | null
        size: number
      }
    }
  | {
      type: 'log'
      payload: {
        level: PhotoSyncLogLevel
        message: string
        timestamp: string
        details?: Record<string, unknown> | null
      }
    }
  | {
      type: 'complete'
      payload: BuilderDebugResult
    }
  | {
      type: 'error'
      payload: {
        message: string
      }
    }

export interface BuilderDebugResult {
  storageKey: string
  resultType: 'new' | 'processed' | 'skipped' | 'failed'
  manifestItem: PhotoManifestItem | null
  thumbnailUrl: string | null
  filesDeleted: boolean
}
