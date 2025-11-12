import { FormError, Input, Label } from '@afilmory/ui'
import type { FC, MutableRefObject } from 'react'

import type { useRegistrationForm } from '~/modules/auth/hooks/useRegistrationForm'
import { slugify } from '~/modules/welcome/utils'

import { firstErrorMessage } from '../utils'

type WorkspaceStepProps = {
  form: ReturnType<typeof useRegistrationForm>
  slugManuallyEditedRef: MutableRefObject<boolean>
  lockedTenantSlug?: string | null
  isSubmitting: boolean
  onFieldInteraction: () => void
}

export const WorkspaceStep: FC<WorkspaceStepProps> = ({
  form,
  slugManuallyEditedRef,
  lockedTenantSlug,
  isSubmitting,
  onFieldInteraction,
}) => (
  <div className="space-y-8">
    <section className="space-y-3">
      <h2 className="text-text text-lg font-semibold">Workspace basics</h2>
      <p className="text-text-secondary text-sm">
        This information appears in navigation, invitations, and other tenant-facing areas.
      </p>
    </section>
    <div className="grid gap-6 md:grid-cols-2">
      <form.Field name="tenantName">
        {(field) => {
          const error = firstErrorMessage(field.state.meta.errors)

          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Workspace name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => {
                  onFieldInteraction()
                  const nextValue = event.currentTarget.value
                  field.handleChange(nextValue)
                  if (!slugManuallyEditedRef.current) {
                    const nextSlug = slugify(nextValue)
                    if (nextSlug !== form.getFieldValue('tenantSlug')) {
                      form.setFieldValue('tenantSlug', () => nextSlug)
                      void form.validateField('tenantSlug', 'change')
                    }
                  }
                }}
                onBlur={field.handleBlur}
                placeholder="Acme Studio"
                disabled={isSubmitting}
                error={Boolean(error)}
                autoComplete="organization"
              />
              <FormError>{error}</FormError>
            </div>
          )
        }}
      </form.Field>
      <form.Field name="tenantSlug">
        {(field) => {
          const error = firstErrorMessage(field.state.meta.errors)
          const isSlugLocked = Boolean(lockedTenantSlug)
          const helperText = isSlugLocked
            ? 'Workspace slug follows the current subdomain and cannot be changed in this flow.'
            : 'Lowercase letters, numbers, and hyphen are allowed. We&apos;ll ensure the slug is unique.'

          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Workspace slug</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => {
                  if (isSlugLocked) {
                    return
                  }
                  onFieldInteraction()
                  slugManuallyEditedRef.current = true
                  field.handleChange(event.currentTarget.value)
                }}
                onBlur={field.handleBlur}
                placeholder="acme"
                disabled={isSubmitting || isSlugLocked}
                readOnly={isSlugLocked}
                error={Boolean(error)}
                autoComplete="off"
              />
              <p className="text-text-tertiary text-xs">{helperText}</p>
              <FormError>{error}</FormError>
            </div>
          )
        }}
      </form.Field>
    </div>
  </div>
)
