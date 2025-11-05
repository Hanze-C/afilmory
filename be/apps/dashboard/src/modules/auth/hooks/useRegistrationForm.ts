import { useState } from 'react'

import { isLikelyEmail, slugify } from '~/modules/onboarding/utils'

export interface TenantRegistrationFormState {
  tenantName: string
  tenantSlug: string
  accountName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}

const REQUIRED_PASSWORD_LENGTH = 8
const ALL_FIELDS: Array<keyof TenantRegistrationFormState> = [
  'tenantName',
  'tenantSlug',
  'accountName',
  'email',
  'password',
  'confirmPassword',
  'termsAccepted',
]

export function useRegistrationForm(initial?: Partial<TenantRegistrationFormState>) {
  const [values, setValues] = useState<TenantRegistrationFormState>({
    tenantName: initial?.tenantName ?? '',
    tenantSlug: initial?.tenantSlug ?? '',
    accountName: initial?.accountName ?? '',
    email: initial?.email ?? '',
    password: initial?.password ?? '',
    confirmPassword: initial?.confirmPassword ?? '',
    termsAccepted: initial?.termsAccepted ?? false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof TenantRegistrationFormState, string>>>({})
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const updateValue = <K extends keyof TenantRegistrationFormState>(
    field: K,
    value: TenantRegistrationFormState[K],
  ) => {
    setValues((prev) => {
      if (field === 'tenantName' && !slugManuallyEdited) {
        return {
          ...prev,
          tenantName: value as string,
          tenantSlug: slugify(value as string),
        }
      }

      if (field === 'tenantSlug') {
        setSlugManuallyEdited(true)
      }

      return { ...prev, [field]: value }
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const fieldError = (field: keyof TenantRegistrationFormState): string | undefined => {
    switch (field) {
      case 'tenantName': {
        return values.tenantName.trim() ? undefined : 'Workspace name is required'
      }
      case 'tenantSlug': {
        const slug = values.tenantSlug.trim()
        if (!slug) return 'Slug is required'
        if (!/^[a-z0-9-]+$/.test(slug)) return 'Use lowercase letters, numbers, and hyphen only'
        return undefined
      }
      case 'email': {
        const email = values.email.trim()
        if (!email) return 'Email is required'
        if (!isLikelyEmail(email)) return 'Enter a valid email address'
        return undefined
      }
      case 'accountName': {
        return values.accountName.trim() ? undefined : 'Administrator name is required'
      }
      case 'password': {
        if (!values.password) return 'Password is required'
        if (values.password.length < REQUIRED_PASSWORD_LENGTH) {
          return `Password must be at least ${REQUIRED_PASSWORD_LENGTH} characters`
        }
        return undefined
      }
      case 'confirmPassword': {
        if (!values.confirmPassword) return 'Confirm your password'
        if (values.confirmPassword !== values.password) return 'Passwords do not match'
        return undefined
      }
      case 'termsAccepted': {
        return values.termsAccepted ? undefined : 'You must accept the terms to continue'
      }
    }

    return undefined
  }

  const validate = (fields?: Array<keyof TenantRegistrationFormState>) => {
    const fieldsToValidate = fields ?? ALL_FIELDS
    const stepErrors: Partial<Record<keyof TenantRegistrationFormState, string>> = {}
    let hasErrors = false

    for (const field of fieldsToValidate) {
      const error = fieldError(field)
      if (error) {
        stepErrors[field] = error
        hasErrors = true
      }
    }

    setErrors((prev) => {
      const next = { ...prev }
      for (const field of fieldsToValidate) {
        const error = stepErrors[field]
        if (error) {
          next[field] = error
        } else {
          delete next[field]
        }
      }
      return next
    })

    return !hasErrors
  }

  const reset = () => {
    setValues({
      tenantName: '',
      tenantSlug: '',
      accountName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    })
    setErrors({})
    setSlugManuallyEdited(false)
  }

  return {
    values,
    errors,
    updateValue,
    validate,
    getFieldError: fieldError,
    reset,
  }
}
