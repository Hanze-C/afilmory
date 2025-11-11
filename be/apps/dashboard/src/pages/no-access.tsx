import { Button } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { useQueryClient } from '@tanstack/react-query'
import { m } from 'motion/react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useAccessDeniedValue, useSetAccessDenied } from '~/atoms/access-denied'
import { useSetAuthUser } from '~/atoms/auth'
import { ROUTE_PATHS } from '~/constants/routes'
import { AUTH_SESSION_QUERY_KEY } from '~/modules/auth/api/session'
import { signOutBySource } from '~/modules/auth/auth-client'
import { LinearBorderContainer } from '~/modules/welcome/components/LinearBorderContainer'

export const Component: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accessDenied = useAccessDeniedValue()
  const setAccessDenied = useSetAccessDenied()
  const setAuthUser = useSetAuthUser()

  const state = (location.state ?? {}) as { from?: string; reason?: string | null; status?: number }
  const originPath = state.from ?? accessDenied?.path ?? ROUTE_PATHS.DEFAULT_AUTHENTICATED
  const status = state.status ?? accessDenied?.status ?? 403
  const reason = state.reason ?? accessDenied?.reason

  const title = status === 403 ? '权限不足' : '无法访问'
  const description =
    reason ?? '你当前的账号没有访问该功能所需的权限，请联系工作区管理员，或切换到拥有权限的账号后重试。'

  const hint = useMemo(() => {
    if (!originPath || originPath === ROUTE_PATHS.NO_ACCESS) {
      return null
    }
    return originPath
  }, [originPath])

  const handleBackToLogin = async () => {
    try {
      await signOutBySource()
    } catch (error) {
      console.error('Failed to sign out before returning to login', error)
    } finally {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null)
      void queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      setAuthUser(null)
      setAccessDenied(null)
      navigate(ROUTE_PATHS.LOGIN, { replace: true })
    }
  }

  const handleRetry = () => {
    setAccessDenied(null)
    navigate(hint ?? ROUTE_PATHS.DEFAULT_AUTHENTICATED, { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <div className="bg-background flex flex-1 items-center justify-center">
        <LinearBorderContainer>
          <div className="bg-background-tertiary relative w-[600px]">
            <div className="p-12">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={Spring.presets.smooth}>
                <h1 className="text-text mb-4 text-3xl font-bold">{title}</h1>
                <p className="text-text-secondary mb-6 text-base leading-relaxed">{description}</p>
                {hint && (
                  <div className="bg-material-medium border-fill-tertiary mb-6 rounded-lg border px-4 py-3">
                    <p className="text-text-secondary text-sm">
                      请求路径: <span className="text-text font-medium">{hint}</span>
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="primary" className="flex-1" onClick={handleRetry}>
                    重新尝试
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={handleBackToLogin}>
                    返回登录
                  </Button>
                </div>
              </m.div>
            </div>
          </div>
        </LinearBorderContainer>
      </div>
    </div>
  )
}
