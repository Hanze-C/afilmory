import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSettings, updateSettings } from '~/modules/settings'

import { STORAGE_SETTING_KEYS } from './constants'
import type { StorageProvidersPayload } from './types'
import {
  ensureActiveProviderId,
  parseStorageProviders,
  serializeStorageProviders,
} from './utils'

export const STORAGE_PROVIDERS_QUERY_KEY = ['settings', 'storage-providers'] as const

export const useStorageProvidersQuery = () => {
  return useQuery({
    queryKey: STORAGE_PROVIDERS_QUERY_KEY,
    queryFn: async () => {
      const response = await getSettings([
        STORAGE_SETTING_KEYS.providers,
        STORAGE_SETTING_KEYS.activeProvider,
      ])

      const rawProviders = response.values[STORAGE_SETTING_KEYS.providers] ?? '[]'
      const providers = parseStorageProviders(rawProviders)
      const activeProviderRaw =
        response.values[STORAGE_SETTING_KEYS.activeProvider] ?? ''
      const activeProviderId =
        typeof activeProviderRaw === 'string' && activeProviderRaw.trim().length > 0
          ? activeProviderRaw.trim()
          : null

      return {
        providers,
        activeProviderId: ensureActiveProviderId(providers, activeProviderId),
      }
    },
  })
}

export const useUpdateStorageProvidersMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StorageProvidersPayload) => {
      await updateSettings([
        {
          key: STORAGE_SETTING_KEYS.providers,
          value: serializeStorageProviders(payload.providers),
        },
        {
          key: STORAGE_SETTING_KEYS.activeProvider,
          value: payload.activeProviderId ?? '',
        },
      ])
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: STORAGE_PROVIDERS_QUERY_KEY,
      })
    },
  })
}
