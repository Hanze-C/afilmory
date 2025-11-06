import { Button } from '@afilmory/ui'
import { cx } from '@afilmory/utils'
import { memo, useCallback, useMemo } from 'react'

import { signInSocial } from '../auth-client'
import { useSocialProviders } from '../hooks/useSocialProviders'

export interface SocialAuthButtonsProps {
  className?: string
  title?: string
  requestSignUp?: boolean
  callbackURL?: string
  errorCallbackURL?: string
  newUserCallbackURL?: string
  disableRedirect?: boolean
  layout?: 'grid' | 'row'
}

export const SocialAuthButtons = memo(function SocialAuthButtons({
  className,
  title = 'Or continue with',
  requestSignUp = false,
  callbackURL,
  errorCallbackURL,
  newUserCallbackURL,
  disableRedirect,
  layout = 'grid',
}: SocialAuthButtonsProps) {
  const { data, isLoading } = useSocialProviders()

  const providers = data?.providers ?? []

  const resolvedCallbackURL = useMemo(() => {
    if (callbackURL) {
      return callbackURL
    }
    if (typeof window !== 'undefined') {
      return window.location.href
    }
    return
  }, [callbackURL])

  const handleSocialClick = useCallback(
    async (providerId: string) => {
      try {
        await signInSocial({
          provider: providerId,
          requestSignUp,
          callbackURL: resolvedCallbackURL,
          errorCallbackURL,
          newUserCallbackURL,
          disableRedirect,
        })
      } catch (error) {
        console.error('Failed to initiate social sign-in', error)
      }
    },
    [disableRedirect, errorCallbackURL, newUserCallbackURL, requestSignUp, resolvedCallbackURL],
  )

  if (isLoading) {
    return <div className={cx('text-text-tertiary text-xs italic', className)}>Loading available providers...</div>
  }

  if (providers.length === 0) {
    return null
  }

  const containerClass = layout === 'row' ? 'flex flex-wrap gap-2' : 'grid gap-2 sm:grid-cols-2'

  return (
    <div className={cx('space-y-3', className)}>
      {title ? <p className="text-text-tertiary text-xs uppercase tracking-wide">{title}</p> : null}
      <div className={containerClass}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="ghost"
            size="md"
            className="justify-start gap-3"
            onClick={() => handleSocialClick(provider.id)}
          >
            <span className="flex items-center gap-3">
              <i className={cx('text-lg', provider.icon)} aria-hidden />
              <span>{provider.name}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
})
