import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSettingUiSchema, updateSettings } from './api'
import type { SettingEntryInput } from './types'

export const SETTING_UI_SCHEMA_QUERY_KEY = ['settings', 'ui-schema'] as const

export const useSettingUiSchemaQuery = () => {
  return useQuery({
    queryKey: SETTING_UI_SCHEMA_QUERY_KEY,
    queryFn: getSettingUiSchema,
  })
}

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entries: ReadonlyArray<SettingEntryInput>) => {
      await updateSettings(entries)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTING_UI_SCHEMA_QUERY_KEY })
    },
  })
}
