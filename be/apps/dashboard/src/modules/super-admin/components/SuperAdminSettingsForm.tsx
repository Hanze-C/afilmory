import { Button } from '@afilmory/ui'
import { DEFAULT_BASE_DOMAIN, Spring } from '@afilmory/utils'
import { m } from 'motion/react'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LinearBorderPanel } from '~/components/common/GlassPanel'

import { SchemaFormRenderer } from '../../schema-form/SchemaFormRenderer'
import type { SchemaFormValue } from '../../schema-form/types'
import { useSuperAdminSettingsQuery, useUpdateSuperAdminSettingsMutation } from '../hooks'
import type {
  SuperAdminSettingField,
  SuperAdminSettings,
  SuperAdminSettingsResponse,
  UpdateSuperAdminSettingsPayload,
} from '../types'

type FormState = Record<SuperAdminSettingField, SchemaFormValue>

const BOOLEAN_FIELDS = new Set<SuperAdminSettingField>(['allowRegistration', 'localProviderEnabled'])

function asString(value: SchemaFormValue): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return String(value)
}

function toFormState(settings: SuperAdminSettings): FormState {
  return {
    allowRegistration: settings.allowRegistration,
    localProviderEnabled: settings.localProviderEnabled,
    maxRegistrableUsers: settings.maxRegistrableUsers === null ? '' : String(settings.maxRegistrableUsers),
    baseDomain: (settings.baseDomain ?? DEFAULT_BASE_DOMAIN) || DEFAULT_BASE_DOMAIN,
  }
}

function areFormStatesEqual(left: FormState | null, right: FormState | null): boolean {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return (
    left.allowRegistration === right.allowRegistration &&
    left.localProviderEnabled === right.localProviderEnabled &&
    left.maxRegistrableUsers === right.maxRegistrableUsers &&
    asString(left.baseDomain).trim() === asString(right.baseDomain).trim()
  )
}

function normalizeMaxUsers(value: SchemaFormValue): string {
  if (typeof value === 'string') {
    return value
  }

  if (value == null) {
    return ''
  }

  return String(value)
}

type PossiblySnakeCaseSettings = Partial<
  SuperAdminSettings & {
    allow_registration: boolean
    local_provider_enabled: boolean
    max_registrable_users: number | null
    base_domain: string
  }
>

function coerceMaxUsers(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeServerSettings(input: PossiblySnakeCaseSettings | null): SuperAdminSettings | null {
  if (!input) {
    return null
  }

  if ('allowRegistration' in input || 'localProviderEnabled' in input) {
    return {
      allowRegistration: input.allowRegistration ?? false,
      localProviderEnabled: input.localProviderEnabled ?? false,
      maxRegistrableUsers: coerceMaxUsers(input.maxRegistrableUsers),
      baseDomain: ((input.baseDomain ?? DEFAULT_BASE_DOMAIN) || DEFAULT_BASE_DOMAIN).toString(),
    }
  }

  if ('allow_registration' in input || 'local_provider_enabled' in input || 'max_registrable_users' in input) {
    return {
      allowRegistration: input.allow_registration ?? false,
      localProviderEnabled: input.local_provider_enabled ?? false,
      maxRegistrableUsers: coerceMaxUsers(input.max_registrable_users),
      baseDomain: ((input.base_domain ?? DEFAULT_BASE_DOMAIN) || DEFAULT_BASE_DOMAIN).toString(),
    }
  }

  return null
}

function extractServerValues(payload: SuperAdminSettingsResponse): SuperAdminSettings | null {
  if ('values' in payload) {
    return normalizeServerSettings(payload.values ?? null)
  }

  if ('settings' in payload) {
    return normalizeServerSettings(payload.settings ?? null)
  }

  return null
}

export function SuperAdminSettingsForm() {
  const { data, isLoading, isError, error } = useSuperAdminSettingsQuery()
  const [formState, setFormState] = useState<FormState | null>(null)
  const [initialState, setInitialState] = useState<FormState | null>(null)
  const lastServerStateRef = useRef<FormState | null>(null)

  const syncFromServer = useCallback((payload: SuperAdminSettingsResponse) => {
    const serverValues = extractServerValues(payload)
    if (!serverValues) {
      return
    }

    const nextState = toFormState(serverValues)
    const lastState = lastServerStateRef.current
    if (lastState && areFormStatesEqual(lastState, nextState)) {
      return
    }

    lastServerStateRef.current = nextState

    startTransition(() => {
      setFormState(nextState)
      setInitialState(nextState)
    })
  }, [])

  const updateMutation = useUpdateSuperAdminSettingsMutation({
    onSuccess: syncFromServer,
  })

  useEffect(() => {
    if (!data) {
      return
    }

    syncFromServer(data)
  }, [data, syncFromServer])

  const hasChanges = useMemo(() => {
    if (!formState || !initialState) {
      return false
    }

    return !areFormStatesEqual(formState, initialState)
  }, [formState, initialState])

  const handleChange = useCallback((key: SuperAdminSettingField, value: SchemaFormValue) => {
    setFormState((prev) => {
      if (!prev) {
        return prev
      }

      if (BOOLEAN_FIELDS.has(key)) {
        return {
          ...prev,
          [key]: Boolean(value),
        }
      }

      if (key === 'maxRegistrableUsers') {
        return {
          ...prev,
          [key]: normalizeMaxUsers(value),
        }
      }

      return {
        ...prev,
        [key]: value,
      }
    })
  }, [])

  const buildPayload = (): UpdateSuperAdminSettingsPayload | null => {
    if (!formState || !initialState) {
      return null
    }

    const payload: UpdateSuperAdminSettingsPayload = {}

    if (formState.allowRegistration !== initialState.allowRegistration) {
      payload.allowRegistration = Boolean(formState.allowRegistration)
    }

    if (formState.localProviderEnabled !== initialState.localProviderEnabled) {
      payload.localProviderEnabled = Boolean(formState.localProviderEnabled)
    }

    if (formState.maxRegistrableUsers !== initialState.maxRegistrableUsers) {
      const trimmed = normalizeMaxUsers(formState.maxRegistrableUsers).trim()
      if (trimmed.length === 0) {
        payload.maxRegistrableUsers = null
      } else {
        const parsed = Number(trimmed)
        if (Number.isFinite(parsed)) {
          payload.maxRegistrableUsers = Math.max(0, Math.floor(parsed))
        }
      }
    }

    if (asString(formState.baseDomain).trim() !== asString(initialState.baseDomain).trim()) {
      const value = asString(formState.baseDomain).trim()
      payload.baseDomain = (value.length > 0 ? value : DEFAULT_BASE_DOMAIN).toLowerCase()
    }

    return Object.keys(payload).length > 0 ? payload : null
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const payload = buildPayload()
    if (!payload) {
      return
    }

    updateMutation.mutate(payload)
  }

  const mutationMessage = useMemo(() => {
    if (updateMutation.isError) {
      const reason = updateMutation.error instanceof Error ? updateMutation.error.message : '保存失败'
      return `保存失败：${reason}`
    }

    if (updateMutation.isPending) {
      return '正在保存设置...'
    }

    if (!hasChanges && updateMutation.isSuccess) {
      return '保存成功，设置已更新'
    }

    if (hasChanges) {
      return '您有尚未保存的变更'
    }

    return '所有设置已同步'
  }, [hasChanges, updateMutation.error, updateMutation.isError, updateMutation.isPending, updateMutation.isSuccess])

  if (isError) {
    return (
      <LinearBorderPanel className="p-6">
        <div className="text-red text-sm">
          <span>{`无法加载超级管理员设置：${error instanceof Error ? error.message : '未知错误'}`}</span>
        </div>
      </LinearBorderPanel>
    )
  }

  if (isLoading || !formState || !data) {
    return (
      <LinearBorderPanel className="space-y-4 p-6">
        <div className="bg-fill/40 h-6 w-1/3 animate-pulse rounded-full" />
        <div className="space-y-4">
          {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
            <div key={key} className="bg-fill/30 h-20 animate-pulse rounded-xl" />
          ))}
        </div>
      </LinearBorderPanel>
    )
  }

  const { stats } = data
  const { registrationsRemaining, totalUsers } = stats
  const remainingLabel = (() => {
    if (registrationsRemaining === null || registrationsRemaining === undefined) {
      return '无限制'
    }

    if (typeof registrationsRemaining === 'number' && Number.isFinite(registrationsRemaining)) {
      return String(registrationsRemaining)
    }

    return '-'
  })()

  return (
    <m.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={Spring.presets.smooth}
      className="space-y-6"
    >
      <SchemaFormRenderer schema={data.schema} values={formState} onChange={handleChange} />

      <div className="grid gap-4 md:grid-cols-2">
        <LinearBorderPanel className="p-6">
          <div className="space-y-1">
            <p className="text-text-tertiary text-xs tracking-wide uppercase">当前用户总数</p>
            <p className="text-text text-3xl font-semibold">{typeof totalUsers === 'number' ? totalUsers : 0}</p>
          </div>
        </LinearBorderPanel>
        <LinearBorderPanel className="p-6">
          <div className="space-y-1">
            <p className="text-text-tertiary text-xs tracking-wide uppercase">剩余可注册名额</p>
            <p className="text-text text-3xl font-semibold">{remainingLabel}</p>
          </div>
        </LinearBorderPanel>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="text-text-tertiary text-xs">{mutationMessage}</span>
        <Button
          type="submit"
          disabled={!hasChanges}
          isLoading={updateMutation.isPending}
          loadingText="保存中..."
          variant="primary"
          size="sm"
        >
          保存修改
        </Button>
      </div>
    </m.form>
  )
}
