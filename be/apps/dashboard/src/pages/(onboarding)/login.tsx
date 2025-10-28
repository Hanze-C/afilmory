import { Button, Input, Label } from '@afilmory/ui'
import { Spring } from '@afilmory/utils'
import { m } from 'motion/react'
import { useState } from 'react'

import { useLogin } from '~/modules/auth/hooks/useLogin'
import { LinearBorderContainer } from '~/modules/onboarding/components/LinearBorderContainer'

export const Component = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useLogin()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      return
    }

    login({ email: email.trim(), password })
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) clearError()
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) clearError()
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <div className="bg-background flex flex-1 items-center justify-center">
        <LinearBorderContainer>
          <form
            onSubmit={handleSubmit}
            className="bg-background-tertiary relative w-[600px]"
          >
            <div className="p-12">
              <h1 className="text-text mb-10 text-3xl font-bold">Login</h1>

              {/* Error Message */}
              {error && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={Spring.presets.snappy}
                  className="border-red/60 bg-red/10 mb-6 rounded-lg border px-4 py-3"
                >
                  <p className="text-red text-sm">{error}</p>
                </m.div>
              )}

              {/* Email Field */}
              <div className="mb-6 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  error={!!error}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Password Field */}
              <div className="mb-8 space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  error={!!error}
                  autoComplete="current-password"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={!email.trim() || !password.trim()}
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>

              {/* Additional Links */}
              <div className="mt-6 flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-text-tertiary hover:text-accent"
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-text-tertiary hover:text-accent"
                  disabled={isLoading}
                >
                  Create account
                </Button>
              </div>
            </div>
          </form>
        </LinearBorderContainer>
      </div>
    </div>
  )
}
