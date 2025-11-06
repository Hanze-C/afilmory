import { Button, Checkbox, FormError, Input, Label, ScrollArea } from '@afilmory/ui'
import { cx, Spring } from '@afilmory/utils'
import { m } from 'motion/react'
import type { FC, KeyboardEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'

import { SocialAuthButtons } from '~/modules/auth/components/SocialAuthButtons'
import { useRegisterTenant } from '~/modules/auth/hooks/useRegisterTenant'
import type { TenantRegistrationFormState } from '~/modules/auth/hooks/useRegistrationForm'
import { useRegistrationForm } from '~/modules/auth/hooks/useRegistrationForm'
import { LinearBorderContainer } from '~/modules/onboarding/components/LinearBorderContainer'

const REGISTRATION_STEPS = [
  {
    id: 'workspace',
    title: 'Workspace details',
    description: 'Give your workspace a recognizable name and choose a slug for tenant URLs.',
  },
  {
    id: 'admin',
    title: 'Administrator account',
    description: 'Set up the primary administrator who will manage the workspace after creation.',
  },
  {
    id: 'review',
    title: 'Review & confirm',
    description: 'Verify everything looks right and accept the terms before provisioning the workspace.',
  },
] as const satisfies ReadonlyArray<{
  id: 'workspace' | 'admin' | 'review'
  title: string
  description: string
}>

const STEP_FIELDS: Record<(typeof REGISTRATION_STEPS)[number]['id'], Array<keyof TenantRegistrationFormState>> = {
  workspace: ['tenantName', 'tenantSlug'],
  admin: ['accountName', 'email', 'password', 'confirmPassword'],
  review: ['termsAccepted'],
}

const progressForStep = (index: number) => Math.round((index / (REGISTRATION_STEPS.length - 1 || 1)) * 100)

type SidebarProps = {
  currentStepIndex: number
  canNavigateTo: (index: number) => boolean
  onStepSelect: (index: number) => void
}

const RegistrationSidebar: FC<SidebarProps> = ({ currentStepIndex, canNavigateTo, onStepSelect }) => (
  <aside className="hidden min-h-full flex-col gap-6 p-6 lg:flex">
    <div>
      <p className="text-accent text-xs font-medium">Workspace Setup</p>
      <h2 className="text-text mt-2 text-base font-semibold">Create your tenant</h2>
    </div>

    <div className="relative flex-1">
      {REGISTRATION_STEPS.map((step, index) => {
        const status: 'done' | 'current' | 'pending' =
          index < currentStepIndex ? 'done' : index === currentStepIndex ? 'current' : 'pending'
        const isLast = index === REGISTRATION_STEPS.length - 1
        const isClickable = canNavigateTo(index)

        return (
          <div key={step.id} className="relative flex gap-3">
            {!isLast && (
              <div className="absolute top-7 bottom-0 left-[13px] w-[1.5px]">
                {status === 'done' && <div className="bg-accent h-full w-full" />}
                {status === 'current' && (
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        'linear-gradient(to bottom, var(--color-accent) 0%, var(--color-accent) 35%, color-mix(in srgb, var(--color-text) 15%, transparent) 100%)',
                    }}
                  />
                )}
                {status === 'pending' && <div className="bg-text/15 h-full w-full" />}
              </div>
            )}

            <button
              type="button"
              className={cx(
                'group relative flex w-full items-start gap-3 pb-6 text-left transition-all duration-200',
                isClickable ? 'cursor-pointer' : 'cursor-default',
                !isClickable && 'opacity-60',
              )}
              onClick={() => {
                if (isClickable) onStepSelect(index)
              }}
              disabled={!isClickable}
            >
              <div className="relative z-10 shrink-0 pt-0.5">
                <div
                  className={cx(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                    status === 'done' && 'bg-accent text-white ring-4 ring-accent/10',
                    status === 'current' && 'bg-accent text-white ring-4 ring-accent/25',
                    status === 'pending' && 'border-[1.5px] border-text/20 bg-background text-text-tertiary',
                  )}
                >
                  {status === 'done' ? <i className="i-mingcute-check-fill text-sm" /> : <span>{index + 1}</span>}
                </div>
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cx(
                    'text-sm font-medium transition-colors duration-200',
                    status === 'done' && 'text-text',
                    status === 'current' && 'text-accent',
                    status === 'pending' && 'text-text-tertiary',
                    isClickable && status !== 'current' && 'group-hover:text-text',
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cx(
                    'mt-0.5 text-xs transition-colors duration-200',
                    status === 'done' && 'text-text-secondary',
                    status === 'current' && 'text-text-secondary',
                    status === 'pending' && 'text-text-tertiary',
                  )}
                >
                  {step.description}
                </p>
              </div>
            </button>
          </div>
        )
      })}
    </div>

    <div className="pt-4">
      <div className="via-text/20 mb-4 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />
      <div className="text-text-tertiary mb-2 flex items-center justify-between text-xs">
        <span>Progress</span>
        <span className="text-accent font-medium">{progressForStep(currentStepIndex)}%</span>
      </div>
      <div className="bg-fill-tertiary relative h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-accent absolute top-0 left-0 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressForStep(currentStepIndex)}%` }}
        />
      </div>
    </div>
  </aside>
)

type HeaderProps = {
  currentStepIndex: number
}

const RegistrationHeader: FC<HeaderProps> = ({ currentStepIndex }) => {
  const step = REGISTRATION_STEPS[currentStepIndex]
  return (
    <header className="p-8 pb-6">
      <div className="bg-accent/10 text-accent inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium">
        Step {currentStepIndex + 1} of {REGISTRATION_STEPS.length}
      </div>
      <h1 className="text-text mt-4 text-3xl font-bold">{step.title}</h1>
      <p className="text-text-secondary mt-2 max-w-2xl text-sm">{step.description}</p>
    </header>
  )
}

type FooterProps = {
  disableBack: boolean
  isSubmitting: boolean
  isLastStep: boolean
  onBack: () => void
  onNext: () => void
}

const RegistrationFooter: FC<FooterProps> = ({ disableBack, isSubmitting, isLastStep, onBack, onNext }) => (
  <footer className="flex flex-col gap-3 p-8 pt-6 sm:flex-row sm:items-center sm:justify-between">
    {!disableBack ? (
      <div className="text-text-tertiary text-xs">
        Adjustments are always possible—use the sidebar or go back to modify earlier details.
      </div>
    ) : (
      <div />
    )}
    <div className="flex gap-2">
      {!disableBack && (
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="text-text-secondary hover:text-text hover:bg-fill/50 min-w-[140px]"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
      )}
      <Button type="button" variant="primary" size="md" className="min-w-40" onClick={onNext} isLoading={isSubmitting}>
        {isLastStep ? 'Create workspace' : 'Continue'}
      </Button>
    </div>
  </footer>
)

type StepCommonProps = {
  values: TenantRegistrationFormState
  errors: Partial<Record<keyof TenantRegistrationFormState, string>>
  onFieldChange: <Field extends keyof TenantRegistrationFormState>(
    field: Field,
    value: TenantRegistrationFormState[Field],
  ) => void
  isLoading: boolean
}

const WorkspaceStep: FC<StepCommonProps> = ({ values, errors, onFieldChange, isLoading }) => (
  <div className="space-y-8">
    <section className="space-y-3">
      <h2 className="text-text text-lg font-semibold">Workspace basics</h2>
      <p className="text-text-secondary text-sm">
        This information appears in navigation, invitations, and other tenant-facing areas.
      </p>
    </section>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="tenant-name">Workspace name</Label>
        <Input
          id="tenant-name"
          value={values.tenantName}
          onChange={(event) => onFieldChange('tenantName', event.currentTarget.value)}
          placeholder="Acme Studio"
          disabled={isLoading}
          error={Boolean(errors.tenantName)}
          autoComplete="organization"
        />
        <FormError>{errors.tenantName}</FormError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant-slug">Workspace slug</Label>
        <Input
          id="tenant-slug"
          value={values.tenantSlug}
          onChange={(event) => onFieldChange('tenantSlug', event.currentTarget.value)}
          placeholder="acme"
          disabled={isLoading}
          error={Boolean(errors.tenantSlug)}
          autoComplete="off"
        />
        <p className="text-text-tertiary text-xs">
          Lowercase letters, numbers, and hyphen are allowed. We&apos;ll ensure the slug is unique.
        </p>
        <FormError>{errors.tenantSlug}</FormError>
      </div>
    </div>
  </div>
)

const AdminStep: FC<StepCommonProps> = ({ values, errors, onFieldChange, isLoading }) => (
  <div className="space-y-8">
    <section className="space-y-3">
      <h2 className="text-text text-lg font-semibold">Administrator</h2>
      <p className="text-text-secondary text-sm">
        The first user becomes the workspace administrator and can invite additional members later.
      </p>
    </section>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="account-name">Full name</Label>
        <Input
          id="account-name"
          value={values.accountName}
          onChange={(event) => onFieldChange('accountName', event.currentTarget.value)}
          placeholder="Jane Doe"
          disabled={isLoading}
          error={Boolean(errors.accountName)}
          autoComplete="name"
        />
        <FormError>{errors.accountName}</FormError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-email">Work email</Label>
        <Input
          id="account-email"
          type="email"
          value={values.email}
          onChange={(event) => onFieldChange('email', event.currentTarget.value)}
          placeholder="jane@acme.studio"
          disabled={isLoading}
          error={Boolean(errors.email)}
          autoComplete="email"
        />
        <FormError>{errors.email}</FormError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-password">Password</Label>
        <Input
          id="account-password"
          type="password"
          value={values.password}
          onChange={(event) => onFieldChange('password', event.currentTarget.value)}
          placeholder="Create a strong password"
          disabled={isLoading}
          error={Boolean(errors.password)}
          autoComplete="new-password"
        />
        <FormError>{errors.password}</FormError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-confirm-password">Confirm password</Label>
        <Input
          id="account-confirm-password"
          type="password"
          value={values.confirmPassword}
          onChange={(event) => onFieldChange('confirmPassword', event.currentTarget.value)}
          placeholder="Repeat your password"
          disabled={isLoading}
          error={Boolean(errors.confirmPassword)}
          autoComplete="new-password"
        />
        <FormError>{errors.confirmPassword}</FormError>
      </div>
    </div>
    <p className="text-text-tertiary text-xs">
      We recommend using a secure password manager to store credentials for critical roles like the administrator.
    </p>
    <SocialAuthButtons
      className="border border-white/5 bg-fill/40 rounded-2xl p-4"
      title="Or use single sign-on"
      requestSignUp
    />
  </div>
)

type ReviewStepProps = Omit<StepCommonProps, 'onFieldChange'> & {
  onToggleTerms: (value: boolean) => void
  serverError: string | null
}

const ReviewStep: FC<ReviewStepProps> = ({ values, errors, onToggleTerms, isLoading, serverError }) => (
  <div className="space-y-8">
    <section className="space-y-3">
      <h2 className="text-text text-lg font-semibold">Confirm workspace configuration</h2>
      <p className="text-text-secondary text-sm">
        Double-check the details below. You can go back to make adjustments before creating the workspace.
      </p>
    </section>
    <dl className="bg-fill/40 border border-white/5 grid gap-x-6 gap-y-4 rounded-2xl p-6 md:grid-cols-2">
      <div>
        <dt className="text-text-tertiary text-xs uppercase tracking-wide">Workspace name</dt>
        <dd className="text-text mt-1 text-sm font-medium">{values.tenantName || '—'}</dd>
      </div>
      <div>
        <dt className="text-text-tertiary text-xs uppercase tracking-wide">Workspace slug</dt>
        <dd className="text-text mt-1 text-sm font-medium">{values.tenantSlug || '—'}</dd>
      </div>
      <div>
        <dt className="text-text-tertiary text-xs uppercase tracking-wide">Administrator name</dt>
        <dd className="text-text mt-1 text-sm font-medium">{values.accountName || '—'}</dd>
      </div>
      <div>
        <dt className="text-text-tertiary text-xs uppercase tracking-wide">Administrator email</dt>
        <dd className="text-text mt-1 text-sm font-medium">{values.email || '—'}</dd>
      </div>
    </dl>

    {serverError && (
      <m.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={Spring.presets.snappy}
        className="border-red/60 bg-red/10 rounded-xl border px-4 py-3"
      >
        <p className="text-red text-sm">{serverError}</p>
      </m.div>
    )}

    <section className="space-y-3">
      <h3 className="text-text text-base font-semibold">Policies</h3>
      <p className="text-text-tertiary text-sm">
        Creating a workspace means you agree to comply with our usage guidelines and privacy practices.
      </p>
      <div className="space-y-2">
        <label className="text-text flex items-center gap-3 text-sm">
          <Checkbox
            checked={values.termsAccepted}
            onCheckedChange={(checked) => onToggleTerms(checked === true)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <span className="text-text-secondary">
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        <FormError>{errors.termsAccepted}</FormError>
      </div>
    </section>
  </div>
)

export const RegistrationWizard: FC = () => {
  const { values, errors, updateValue, validate, getFieldError } = useRegistrationForm()
  const { registerTenant, isLoading, error, clearError } = useRegisterTenant()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0)
  const contentRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = contentRef.current
    if (!root) return

    const rafId = requestAnimationFrame(() => {
      const selector = [
        'input:not([type="hidden"]):not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[contenteditable="true"]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',')

      const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector))
      const firstVisible = candidates.find((el) => {
        if (el.getAttribute('aria-hidden') === 'true') return false
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return false
        if ((el as HTMLInputElement).disabled) return false
        return true
      })

      firstVisible?.focus({ preventScroll: true })
    })

    return () => cancelAnimationFrame(rafId)
  }, [currentStepIndex])

  const canNavigateTo = useCallback((index: number) => index <= maxVisitedIndex, [maxVisitedIndex])

  const jumpToStep = useCallback(
    (index: number) => {
      if (isLoading) return
      if (index === currentStepIndex) return
      if (!canNavigateTo(index)) return
      if (error) clearError()
      setCurrentStepIndex(index)
      setMaxVisitedIndex((prev) => Math.max(prev, index))
    },
    [canNavigateTo, clearError, currentStepIndex, error, isLoading],
  )

  const handleFieldChange = useCallback(
    <Field extends keyof TenantRegistrationFormState>(field: Field, value: TenantRegistrationFormState[Field]) => {
      updateValue(field, value)
      if (error) clearError()
    },
    [clearError, error, updateValue],
  )

  const handleBack = useCallback(() => {
    if (isLoading) return
    if (currentStepIndex === 0) return
    if (error) clearError()
    setCurrentStepIndex((prev) => Math.max(0, prev - 1))
  }, [clearError, currentStepIndex, error, isLoading])

  const focusFirstInvalidStep = useCallback(() => {
    const invalidStepIndex = REGISTRATION_STEPS.findIndex((step) =>
      STEP_FIELDS[step.id].some((field) => Boolean(getFieldError(field))),
    )

    if (invalidStepIndex !== -1 && invalidStepIndex !== currentStepIndex) {
      setCurrentStepIndex(invalidStepIndex)
      setMaxVisitedIndex((prev) => Math.max(prev, invalidStepIndex))
    }
  }, [currentStepIndex, getFieldError])

  const handleNext = useCallback(() => {
    if (isLoading) return

    const step = REGISTRATION_STEPS[currentStepIndex]
    const fields = STEP_FIELDS[step.id]

    const isStepValid = validate(fields)
    if (!isStepValid) {
      focusFirstInvalidStep()
      return
    }

    if (step.id === 'review') {
      const formIsValid = validate()
      if (!formIsValid) {
        focusFirstInvalidStep()
        return
      }

      if (error) clearError()

      registerTenant({
        tenantName: values.tenantName,
        tenantSlug: values.tenantSlug,
        accountName: values.accountName,
        email: values.email,
        password: values.password,
      })
      return
    }

    setCurrentStepIndex((prev) => {
      const nextIndex = Math.min(REGISTRATION_STEPS.length - 1, prev + 1)
      setMaxVisitedIndex((visited) => Math.max(visited, nextIndex))
      return nextIndex
    })
  }, [
    clearError,
    currentStepIndex,
    error,
    focusFirstInvalidStep,
    isLoading,
    registerTenant,
    validate,
    values.accountName,
    values.email,
    values.password,
    values.tenantName,
    values.tenantSlug,
  ])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return
      const nativeEvent = event.nativeEvent as unknown as { isComposing?: boolean }
      if (nativeEvent?.isComposing) return

      const target = event.target as HTMLElement
      if (target.isContentEditable) return
      if (target.tagName === 'TEXTAREA') return
      if (target.tagName === 'BUTTON' || target.tagName === 'A') return
      if (target.tagName === 'INPUT') {
        const { type } = target as HTMLInputElement
        if (type === 'checkbox' || type === 'radio') return
      }

      event.preventDefault()
      handleNext()
    },
    [handleNext],
  )

  const StepComponent = useMemo(() => {
    const step = REGISTRATION_STEPS[currentStepIndex]
    switch (step.id) {
      case 'workspace': {
        return <WorkspaceStep values={values} errors={errors} onFieldChange={handleFieldChange} isLoading={isLoading} />
      }
      case 'admin': {
        return <AdminStep values={values} errors={errors} onFieldChange={handleFieldChange} isLoading={isLoading} />
      }
      case 'review': {
        return (
          <ReviewStep
            values={values}
            errors={errors}
            onToggleTerms={(accepted) => handleFieldChange('termsAccepted', accepted)}
            isLoading={isLoading}
            serverError={error}
          />
        )
      }
      default: {
        return null
      }
    }
  }, [currentStepIndex, error, errors, handleFieldChange, isLoading, values])

  const isLastStep = currentStepIndex === REGISTRATION_STEPS.length - 1

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <LinearBorderContainer className="bg-background-tertiary h-[85vh] w-full max-w-5xl">
        <div className="grid h-full lg:grid-cols-[280px_1fr]">
          <div className="relative h-full">
            <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-linear-to-b from-transparent to-transparent" />
            <RegistrationSidebar
              currentStepIndex={currentStepIndex}
              canNavigateTo={canNavigateTo}
              onStepSelect={jumpToStep}
            />
          </div>

          <main className="flex h-full w-[700px] flex-col">
            <div className="shrink-0">
              <RegistrationHeader currentStepIndex={currentStepIndex} />
              <div className="via-text/20 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />
            </div>

            <div className="relative flex h-0 flex-1">
              <ScrollArea rootClassName="absolute! inset-0 h-full w-full">
                <section ref={contentRef} className="p-12" onKeyDown={handleKeyDown}>
                  {StepComponent}
                </section>
              </ScrollArea>
            </div>

            <div className="shrink-0">
              <div className="via-text/20 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />
              <RegistrationFooter
                disableBack={currentStepIndex === 0}
                isSubmitting={isLoading}
                isLastStep={isLastStep}
                onBack={handleBack}
                onNext={handleNext}
              />
            </div>
          </main>
        </div>
      </LinearBorderContainer>

      <p className="text-text-tertiary mt-6 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  )
}
