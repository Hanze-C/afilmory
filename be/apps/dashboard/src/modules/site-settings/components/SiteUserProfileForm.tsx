import { Button, FormHelperText, Input, Label } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { m } from 'motion/react'
import { startTransition, useEffect, useId, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LinearBorderPanel } from '~/components/common/GlassPanel'
import { MainPageLayout, useMainPageLayout } from '~/components/layouts/MainPageLayout'
import { useBlock } from '~/hooks/useBlock'
import { getRequestErrorMessage } from '~/lib/errors'

import { useSiteAuthorProfileQuery, useUpdateSiteAuthorProfileMutation } from '../hooks'
import type { SiteAuthorProfile, UpdateSiteAuthorPayload } from '../types'

type UserFormState = {
  name: string
  displayUsername: string
  username: string
  avatar: string
}

const emptyState: UserFormState = {
  name: '',
  displayUsername: '',
  username: '',
  avatar: '',
}

function toFormState(profile: SiteAuthorProfile): UserFormState {
  return {
    name: profile.name ?? '',
    displayUsername: profile.displayUsername ?? '',
    username: profile.username ?? '',
    avatar: profile.avatar ?? '',
  }
}

function buildPayload(state: UserFormState): UpdateSiteAuthorPayload {
  const normalize = (value: string) => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return {
    name: state.name.trim(),
    displayUsername: normalize(state.displayUsername),
    username: normalize(state.username),
    avatar: normalize(state.avatar),
  }
}

function formatTimestamp(iso: string | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

export function SiteUserProfileForm() {
  const { data, isLoading, isError, error } = useSiteAuthorProfileQuery()
  const updateMutation = useUpdateSiteAuthorProfileMutation()
  const { setHeaderActionState } = useMainPageLayout()
  const formId = useId()
  const [formState, setFormState] = useState<UserFormState>(emptyState)
  const [initialState, setInitialState] = useState<UserFormState>(emptyState)

  useEffect(() => {
    if (!data) {
      return
    }
    const next = toFormState(data)
    startTransition(() => {
      setFormState(next)
      setInitialState(next)
    })
  }, [data])

  const isDirty = useMemo(() => {
    return (
      formState.name !== initialState.name ||
      formState.displayUsername !== initialState.displayUsername ||
      formState.username !== initialState.username ||
      formState.avatar !== initialState.avatar
    )
  }, [formState, initialState])

  const canSubmit = Boolean(data) && !isLoading && isDirty

  useEffect(() => {
    setHeaderActionState({
      disabled: !canSubmit,
      loading: updateMutation.isPending,
    })

    return () => {
      setHeaderActionState({ disabled: false, loading: false })
    }
  }, [canSubmit, setHeaderActionState, updateMutation.isPending])

  const handleChange = (field: keyof UserFormState) => (value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (!data || !isDirty || updateMutation.isPending) {
      return
    }

    try {
      const payload = buildPayload(formState)
      await updateMutation.mutateAsync(payload)
      setInitialState(formState)
      toast.success('用户信息已更新')
    } catch (mutationError) {
      toast.error('保存用户信息失败', {
        description: getRequestErrorMessage(mutationError, '请检查输入内容后重试。'),
      })
    }
  }

  const headerActionPortal = (
    <MainPageLayout.Actions>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        size="sm"
        disabled={!canSubmit}
        isLoading={updateMutation.isPending}
        loadingText="保存中…"
      >
        保存修改
      </Button>
    </MainPageLayout.Actions>
  )

  useBlock({
    when: isDirty,
    title: '离开前请保存设置',
    description: '当前用户信息尚未保存，离开页面会丢失这些更改，确定要继续吗？',
    confirmText: '继续离开',
    cancelText: '留在此页',
  })
  if (isLoading && !data) {
    return (
      <>
        {headerActionPortal}
        <LinearBorderPanel className="p-6">
          <div className="space-y-4">
            <div className="bg-fill/40 h-6 w-2/5 animate-pulse rounded-lg" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`skeleton-field-${index}`} className="space-y-3">
                  <div className="bg-fill/30 h-4 w-1/3 animate-pulse rounded" />
                  <div className="bg-fill/20 h-10 animate-pulse rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </LinearBorderPanel>
      </>
    )
  }

  if (isError && !data) {
    return (
      <>
        {headerActionPortal}
        <LinearBorderPanel className="p-6">
          <div className="text-red flex items-center gap-3 text-sm">
            <i className="i-mingcute-close-circle-fill text-lg" />
            <span>{getRequestErrorMessage(error, '无法加载用户信息')}</span>
          </div>
        </LinearBorderPanel>
      </>
    )
  }

  const profile = data
  const avatarPreview = formState.avatar?.trim() ? formState.avatar.trim() : null
  const previewInitial =
    (formState.displayUsername || formState.name || profile?.email || 'A').charAt(0)?.toUpperCase() ?? 'A'

  return (
    <>
      {headerActionPortal}
      <LinearBorderPanel className="bg-background-secondary">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
          <div>
            <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wider">用户资料</p>
            <h2 className="text-text mt-1 text-xl font-semibold">展示在前台的作者身份</h2>
            <p className="text-text-tertiary mt-1 text-sm">
              这些信息将用于站点头部、RSS Feed 与社交分享卡片，推荐保持与作者个人品牌一致。
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative size-16 sm:size-20 overflow-hidden rounded-full border border-white/5 shadow-inner">
              {avatarPreview ? (
                <img src={avatarPreview} alt="用户头像预览" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="bg-accent/15 text-accent flex h-full w-full items-center justify-center text-2xl font-semibold">
                  {previewInitial}
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-text font-semibold">{formState.displayUsername || formState.name || '作者'}</p>
              <p className="text-text-tertiary text-xs">{profile?.email}</p>
              <p className="text-text-tertiary text-xs">
                最近更新：{formatTimestamp(profile?.updatedAt) || '尚未更新'}
              </p>
            </div>
          </div>
        </div>

        <m.form
          id={formId}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={Spring.presets.smooth}
          className="space-y-6 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">用户名称</Label>
              <Input
                id="user-name"
                value={formState.name}
                onInput={(event) => handleChange('name')(event.currentTarget.value)}
                placeholder="例如：Innei"
                required
              />
              <FormHelperText>用于前台显示与 RSS 作者/编辑字段。</FormHelperText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-display">展示昵称</Label>
              <Input
                id="user-display"
                value={formState.displayUsername}
                onInput={(event) => handleChange('displayUsername')(event.currentTarget.value)}
                placeholder="可选，例如：innei.photo"
              />
              <FormHelperText>留空则使用作者名称，可用于展示更个性化的昵称。</FormHelperText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-username">用户名（可选）</Label>
              <Input
                id="user-username"
                value={formState.username}
                onInput={(event) => handleChange('username')(event.currentTarget.value)}
                placeholder="例如：innei"
              />
              <FormHelperText>用于后台识别作者账号，不会直接展示在前台。</FormHelperText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-avatar">头像链接</Label>
              <Input
                id="user-avatar"
                type="url"
                value={formState.avatar}
                onInput={(event) => handleChange('avatar')(event.currentTarget.value)}
                placeholder="https://cdn.example.com/avatar.png"
              />
              <FormHelperText>支持 http(s) 或以 // 开头的链接，留空则使用首字母。</FormHelperText>
            </div>
          </div>
        </m.form>
      </LinearBorderPanel>
    </>
  )
}
