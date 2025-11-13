import { useMutation } from '@tanstack/react-query'
import { FetchError } from 'ofetch'
import { useState } from 'react'

import type { RegisterTenantPayload } from '~/modules/auth/api/registerTenant'
import { registerTenant } from '~/modules/auth/api/registerTenant'
import { buildTenantUrl } from '~/modules/auth/utils/domain'

import type { TenantSiteFieldKey } from './useRegistrationForm'

interface TenantRegistrationRequest {
  tenantName: string
  tenantSlug: string
  settings: Array<{ key: TenantSiteFieldKey; value: string }>
}

export function useRegisterTenant() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: TenantRegistrationRequest) => {
      const payload: RegisterTenantPayload = {
        tenant: {
          name: data.tenantName.trim(),
          slug: data.tenantSlug.trim(),
        },
        useSessionAccount: true,
      }

      if (data.settings.length > 0) {
        payload.settings = data.settings
      }

      const response = await registerTenant(payload)

      let finalSlug = payload.tenant.slug?.trim() ?? ''

      try {
        const data = (await response.clone().json()) as { tenant?: { slug?: string } } | null
        const slugFromResponse = data?.tenant?.slug?.trim()
        if (slugFromResponse) {
          finalSlug = slugFromResponse
        }
      } catch {
        // ignore parse errors; fall back to submitted slug
      }

      if (!finalSlug) {
        throw new Error('Registration succeeded but the workspace slug could not be determined.')
      }

      return {
        slug: finalSlug,
      }
    },
    onSuccess: ({ slug }) => {
      try {
        const loginUrl = buildTenantUrl(slug, '/platform/login')
        setErrorMessage(null)
        window.location.replace(loginUrl)
      } catch (redirectError) {
        if (redirectError instanceof Error) {
          setErrorMessage(redirectError.message)
        } else {
          setErrorMessage('Registration succeeded but redirect failed. Please use your workspace URL to sign in.')
        }
      }
    },
    onError: (error: Error) => {
      if (error instanceof FetchError) {
        const status = error.statusCode ?? error.response?.status
        const serverMessage = (error.data as any)?.message

        switch (status) {
          case 400: {
            setErrorMessage(serverMessage || 'Please verify your inputs and try again')
            break
          }
          case 403: {
            setErrorMessage(serverMessage || 'Registration is currently disabled')
            break
          }
          case 409: {
            setErrorMessage(serverMessage || 'An account or workspace with these details already exists')
            break
          }
          case 429: {
            setErrorMessage('Too many attempts. Please try again later')
            break
          }
          default: {
            setErrorMessage(serverMessage || error.message || 'Registration failed. Please try again')
          }
        }
      } else {
        setErrorMessage(error.message || 'An unexpected error occurred. Please try again')
      }
    },
  })

  const clearError = () => setErrorMessage(null)

  return {
    registerTenant: mutation.mutate,
    isLoading: mutation.isPending,
    error: errorMessage,
    clearError,
  }
}
