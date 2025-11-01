import { coreApi } from '~/lib/api-client'

import type { SettingEntryInput, SettingUiSchemaResponse } from './types'

export async function getSettingUiSchema() {
  return await coreApi<SettingUiSchemaResponse>('/settings/ui-schema')
}

export async function getSettings(keys: readonly string[]) {
  return await coreApi<{
    keys: string[]
    values: Record<string, string | null>
  }>('/settings/batch', {
    body: { keys },
    method: 'POST',
  })
}

export async function updateSettings(entries: readonly SettingEntryInput[]) {
  return await coreApi<{ updated: readonly SettingEntryInput[] }>('/settings', {
    method: 'POST',
    body: { entries },
  })
}
