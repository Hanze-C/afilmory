import { Checkbox } from '@afilmory/ui'
import type { FC } from 'react'

import type { SettingFieldDefinition } from '../../constants'
import type {
  AdminFormState,
  OnboardingErrors,
  TenantFormState,
} from '../../types'
import { maskSecret } from '../../utils'

export type ReviewSettingEntry = {
  definition: SettingFieldDefinition
  value: string
}

type ReviewStepProps = {
  tenant: TenantFormState
  admin: AdminFormState
  reviewSettings: ReviewSettingEntry[]
  acknowledged: boolean
  errors: OnboardingErrors
  onAcknowledgeChange: (checked: boolean) => void
}

export const ReviewStep: FC<ReviewStepProps> = ({
  tenant,
  admin,
  reviewSettings,
  acknowledged,
  errors,
  onAcknowledgeChange,
}) => (
  <div className="space-y-6">
    <div className="border-fill-tertiary bg-background rounded-lg border p-6">
      <h3 className="text-text mb-4 text-sm font-semibold">Tenant summary</h3>
      <dl className="text-text-secondary grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text font-semibold">Name</dt>
          <dd className="mt-1">{tenant.name || '—'}</dd>
        </div>
        <div>
          <dt className="text-text font-semibold">Slug</dt>
          <dd className="mt-1">{tenant.slug || '—'}</dd>
        </div>
        <div>
          <dt className="text-text font-semibold">Domain</dt>
          <dd className="mt-1">{tenant.domain || 'Not configured'}</dd>
        </div>
      </dl>
    </div>

    <div className="border-fill-tertiary bg-background rounded-lg border p-6">
      <h3 className="text-text mb-4 text-sm font-semibold">Administrator</h3>
      <dl className="text-text-secondary grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text font-semibold">Name</dt>
          <dd className="mt-1">{admin.name || '—'}</dd>
        </div>
        <div>
          <dt className="text-text font-semibold">Email</dt>
          <dd className="mt-1">{admin.email || '—'}</dd>
        </div>
        <div>
          <dt className="text-text font-semibold">Password</dt>
          <dd className="mt-1">{maskSecret(admin.password)}</dd>
        </div>
      </dl>
    </div>

    <div className="border-fill-tertiary bg-background rounded-lg border p-6">
      <h3 className="text-text mb-4 text-sm font-semibold">
        Enabled integrations
      </h3>
      {reviewSettings.length === 0 ? (
        <p className="text-text-tertiary text-sm">
          No integrations configured. You can enable OAuth providers, AI
          services, or maps later from the settings panel.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviewSettings.map(({ definition, value }) => (
            <li
              key={definition.key}
              className="border-fill-tertiary bg-background rounded-lg border px-4 py-3"
            >
              <p className="text-text text-sm font-medium">
                {definition.label}
              </p>
              <p className="text-text-tertiary mt-1">
                {definition.sensitive ? maskSecret(value) : value}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="border-orange/40 bg-orange/5 rounded-lg border p-6">
      <h3 className="text-orange mb-2 flex items-center gap-2 text-sm font-semibold">
        <i className="i-mingcute-alert-fill" />
        Important
      </h3>
      <p className="text-orange/90 text-sm leading-relaxed">
        Once you click initialize, the application becomes locked to this
        initial administrator. The core service will print super administrator
        credentials to stdout exactly once.
      </p>
      <label className="text-text mt-4 flex items-start gap-3 text-sm">
        <Checkbox
          checked={acknowledged}
          onCheckedChange={(checked) => onAcknowledgeChange(Boolean(checked))}
          className="mt-0.5"
        />
        <span>
          I have noted the super administrator credentials will appear in the
          backend logs and understand this action cannot be repeated.
        </span>
      </label>
      {errors['review.ack'] && (
        <p className="text-red mt-2 text-xs">{errors['review.ack']}</p>
      )}
    </div>
  </div>
)
