import { coreApi } from '~/lib/api-client'

import type { SettingEntryInput, SettingUiSchemaResponse } from './types'

export const getSettingUiSchema = async () => {
  return await coreApi<SettingUiSchemaResponse>('/settings/ui-schema')
}

export const getSettings = async (keys: ReadonlyArray<string>) => {
  return await coreApi<{
    keys: string[]
    values: Record<string, string | null>
  }>('/settings', {
    query: { keys },
  })
}

export const updateSettings = async (entries: ReadonlyArray<SettingEntryInput>) => {
  return await coreApi<{ updated: ReadonlyArray<SettingEntryInput> }>('/settings', {
    method: 'POST',
    body: { entries },
  })
}
