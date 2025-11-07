import { useMutation, useQuery } from '@tanstack/react-query'
import { FetchError } from 'ofetch'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { UiFieldNode, UiSchema } from '~/modules/schema-form/types'

import type { OnboardingInitPayload } from '../api'
import { getOnboardingSiteSchema, getOnboardingStatus, postOnboardingInit } from '../api'
import type { OnboardingSettingKey, OnboardingSiteSettingKey, OnboardingStepId } from '../constants'
import { ONBOARDING_STEPS } from '../constants'
import { DEFAULT_SITE_SETTINGS_VALUES, SITE_SETTINGS_KEYS, siteSettingsSchema } from '../siteSchema'
import type { AdminFormState, OnboardingErrors, SettingFormState, SiteFormState, TenantFormState } from '../types'
import {
  coerceSiteFieldValue,
  collectSchemaFieldMap,
  createInitialSettingsState,
  createInitialSiteStateFromFieldMap,
  getFieldByKey,
  isLikelyEmail,
  maskSecret,
  serializeSiteFieldValue,
  slugify,
} from '../utils'

const INITIAL_STEP_INDEX = 0

export function useOnboardingWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(INITIAL_STEP_INDEX)
  const [tenant, setTenant] = useState<TenantFormState>({
    name: '',
    slug: '',
  })
  const [slugLocked, setSlugLocked] = useState(false)
  const [admin, setAdmin] = useState<AdminFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [settingsState, setSettingsState] = useState<SettingFormState>(createInitialSettingsState)
  const [site, setSite] = useState<SiteFormState>(() => ({ ...DEFAULT_SITE_SETTINGS_VALUES }))
  const [acknowledged, setAcknowledged] = useState(false)
  const [errors, setErrors] = useState<OnboardingErrors>({})
  const [siteDefaultsApplied, setSiteDefaultsApplied] = useState(false)

  const currentStep = ONBOARDING_STEPS[currentStepIndex] ?? ONBOARDING_STEPS[INITIAL_STEP_INDEX]

  const query = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: getOnboardingStatus,
    staleTime: Infinity,
  })

  const siteSchemaQuery = useQuery({
    queryKey: ['onboarding', 'site-schema'],
    queryFn: getOnboardingSiteSchema,
    staleTime: Infinity,
  })

  const siteSchemaData = siteSchemaQuery.data as
    | {
        schema?: UiSchema<OnboardingSiteSettingKey>
        values?: Partial<Record<OnboardingSiteSettingKey, unknown>>
      }
    | undefined

  const siteSchema = siteSchemaData?.schema ?? null

  useEffect(() => {
    if (!siteSchema || siteDefaultsApplied) {
      return
    }

    const fieldMap = collectSchemaFieldMap(siteSchema)
    const defaults = createInitialSiteStateFromFieldMap(fieldMap)
    const values = siteSchemaData?.values ?? {}
    const next: SiteFormState = { ...DEFAULT_SITE_SETTINGS_VALUES, ...defaults }

    for (const [key, field] of fieldMap) {
      const coerced = coerceSiteFieldValue(field, values[key])
      if (coerced !== undefined) {
        next[key] = coerced
      }
    }

    setSite(next)
    setSiteDefaultsApplied(true)
  }, [siteDefaultsApplied, siteSchema, siteSchemaData?.values])

  const siteSchemaLoading = siteSchemaQuery.isLoading && !siteSchema
  const siteSchemaError = siteSchemaQuery.isError

  const mutation = useMutation({
    mutationFn: (payload: OnboardingInitPayload) => postOnboardingInit(payload),
    onSuccess: () => {
      toast.success('Initialization completed', {
        description:
          'Super administrator credentials were printed to the core service logs. Store them securely before closing the terminal.',
      })
      void query.refetch()
    },
    onError: (error) => {
      if (error instanceof FetchError) {
        const message =
          typeof error.data === 'object' && error.data && 'message' in error.data
            ? String(error.data.message)
            : 'Backend rejected the initialization request.'
        toast.error('Initialization failed', { description: message })
      } else {
        toast.error('Initialization failed', {
          description: 'Unexpected error occurred. Please retry or inspect the logs.',
        })
      }
    },
  })

  const setFieldError = (key: string, reason: string | null) => {
    setErrors((prev) => {
      const next = { ...prev }
      if (!reason) {
        delete next[key]
      } else {
        next[key] = reason
      }
      return next
    })
  }

  const validateTenant = () => {
    let valid = true
    const name = tenant.name.trim()
    if (!name) {
      setFieldError('tenant.name', 'Workspace name is required')
      valid = false
    } else {
      setFieldError('tenant.name', null)
    }

    const slug = tenant.slug.trim()
    if (!slug) {
      setFieldError('tenant.slug', 'Slug is required')
      valid = false
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      setFieldError('tenant.slug', 'Only lowercase letters, numbers, and hyphen are allowed')
      valid = false
    } else {
      setFieldError('tenant.slug', null)
    }

    return valid
  }

  const validateAdmin = () => {
    let valid = true
    const name = admin.name.trim()
    if (!name) {
      setFieldError('admin.name', 'Administrator name is required')
      valid = false
    } else if (/^root$/i.test(name)) {
      setFieldError('admin.name', 'The name "root" is reserved')
      valid = false
    } else {
      setFieldError('admin.name', null)
    }

    const email = admin.email.trim()
    if (!email) {
      setFieldError('admin.email', 'Email is required')
      valid = false
    } else if (!isLikelyEmail(email)) {
      setFieldError('admin.email', 'Enter a valid email address')
      valid = false
    } else {
      setFieldError('admin.email', null)
    }

    if (!admin.password) {
      setFieldError('admin.password', 'Password is required')
      valid = false
    } else if (admin.password.length < 8) {
      setFieldError('admin.password', 'Password must be at least 8 characters')
      valid = false
    } else {
      setFieldError('admin.password', null)
    }

    if (!admin.confirmPassword) {
      setFieldError('admin.confirmPassword', 'Confirm the password to continue')
      valid = false
    } else if (admin.confirmPassword !== admin.password) {
      setFieldError('admin.confirmPassword', 'Passwords do not match')
      valid = false
    } else {
      setFieldError('admin.confirmPassword', null)
    }

    return valid
  }

  const validateSite = () => {
    const candidate: Record<string, unknown> = {}
    for (const key of SITE_SETTINGS_KEYS) {
      candidate[key] = site[key] ?? DEFAULT_SITE_SETTINGS_VALUES[key]
    }

    const result = siteSettingsSchema.safeParse(candidate)
    const fieldErrors: Record<string, string> = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const pathKey = issue.path[0]
        if (typeof pathKey === 'string' && !(pathKey in fieldErrors)) {
          fieldErrors[pathKey] = issue.message
        }
      }
    }

    for (const key of SITE_SETTINGS_KEYS) {
      setFieldError(key, fieldErrors[key] ?? null)
    }

    return result.success
  }

  const validateSettings = () => {
    let valid = true
    for (const [key, entry] of Object.entries(settingsState) as Array<
      [OnboardingSettingKey, SettingFormState[OnboardingSettingKey]]
    >) {
      if (!entry.enabled) {
        setFieldError(`settings.${key}`, null)
        continue
      }
      if (!entry.value.trim()) {
        setFieldError(`settings.${key}`, 'Value is required when the setting is enabled')
        valid = false
      } else {
        setFieldError(`settings.${key}`, null)
      }
    }
    return valid
  }

  const validateAcknowledgement = () => {
    if (!acknowledged) {
      setFieldError('review.ack', 'Please confirm you saved the super administrator credentials before continuing')
      return false
    }
    setFieldError('review.ack', null)
    return true
  }

  const validators: Partial<Record<OnboardingStepId, () => boolean>> = {
    welcome: () => true,
    tenant: validateTenant,
    site: validateSite,
    admin: validateAdmin,
    settings: validateSettings,
    review: validateAcknowledgement,
  }

  const submitInitialization = () => {
    const payload: OnboardingInitPayload = {
      tenant: {
        name: tenant.name.trim(),
        slug: tenant.slug.trim(),
      },
      admin: {
        name: admin.name.trim(),
        email: admin.email.trim(),
        password: admin.password,
      },
    }

    const settingEntries = Object.entries(settingsState)
      .filter(([, entry]) => entry.enabled && entry.value.trim())
      .map(([key, entry]) => ({
        key: key as OnboardingSettingKey,
        value: entry.value.trim(),
      }))

    const fieldMap = siteSchema
      ? collectSchemaFieldMap(siteSchema)
      : new Map<OnboardingSiteSettingKey, UiFieldNode<OnboardingSiteSettingKey>>()
    const siteEntries = Array.from(fieldMap.entries()).map(([key, field]) => ({
      key,
      value: serializeSiteFieldValue(field, site[key]),
    }))

    const combined = [...settingEntries, ...siteEntries]

    if (combined.length > 0) {
      payload.settings = combined as Array<{ key: OnboardingSettingKey | OnboardingSiteSettingKey; value: string }>
    }

    mutation.mutate(payload)
  }

  const goToNext = () => {
    const validator = validators[currentStep.id]
    if (validator && !validator()) {
      return
    }

    if (currentStepIndex === ONBOARDING_STEPS.length - 1) {
      submitInitialization()
      return
    }

    setCurrentStepIndex((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1))
  }

  const goToPrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const jumpToStep = (index: number) => {
    if (index <= currentStepIndex) {
      setCurrentStepIndex(index)
    }
  }

  const updateTenantName = (value: string) => {
    setTenant((prev) => {
      if (!slugLocked) {
        return { ...prev, name: value, slug: slugify(value) }
      }
      return { ...prev, name: value }
    })
    setFieldError('tenant.name', null)
  }

  const updateTenantSlug = (value: string) => {
    setSlugLocked(true)
    setTenant((prev) => ({ ...prev, slug: value }))
    setFieldError('tenant.slug', null)
  }

  const updateAdminField = (field: keyof AdminFormState, value: string) => {
    setAdmin((prev) => ({ ...prev, [field]: value }))
    setFieldError(`admin.${field}`, null)
  }

  const toggleSetting = (key: OnboardingSettingKey, enabled: boolean) => {
    setSettingsState((prev) => {
      const next = { ...prev, [key]: { ...prev[key], enabled } }
      if (!enabled) {
        next[key].value = ''
        setFieldError(`settings.${key}`, null)
      }
      return next
    })
  }

  const updateSettingValue = (key: OnboardingSettingKey, value: string) => {
    setSettingsState((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }))
    setFieldError(`settings.${key}`, null)
  }

  const reviewSettings = Object.entries(settingsState)
    .filter(([, entry]) => entry.enabled && entry.value.trim())
    .map(([key, entry]) => ({
      definition: getFieldByKey(key as OnboardingSettingKey),
      value: entry.value.trim(),
    }))

  const updateSiteField = (key: OnboardingSiteSettingKey, value: string | boolean) => {
    setSite((prev) => ({
      ...prev,
      [key]:
        typeof value === 'boolean' ? value : value == null ? '' : typeof value === 'number' ? String(value) : value,
    }))
    setFieldError(key, null)
  }

  return {
    query,
    mutation,
    siteSchema,
    siteSchemaLoading,
    siteSchemaError,
    currentStepIndex,
    currentStep,
    goToNext,
    goToPrevious,
    jumpToStep,
    canNavigateTo: (index: number) => index <= currentStepIndex,
    tenant,
    admin,
    site,
    settingsState,
    acknowledged,
    setAcknowledged: (value: boolean) => {
      setAcknowledged(value)
      if (value) {
        setFieldError('review.ack', null)
      }
    },
    errors,
    updateTenantName,
    updateTenantSlug,
    updateAdminField,
    toggleSetting,
    updateSettingValue,
    updateSiteField,
    reviewSettings,
    maskSecret,
  }
}
