import { HttpContext } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'

import { PLACEHOLDER_TENANT_SLUG } from './tenant.constants'
import type { TenantContext } from './tenant.types'

export function getTenantContext<TRequired extends boolean = false>(options?: {
  required?: TRequired
}): TRequired extends true ? TenantContext : TenantContext | undefined {
  const context = HttpContext.getValue('tenant')
  if (options?.required && !context) {
    throw new BizException(ErrorCode.TENANT_NOT_FOUND)
  }
  return context as TRequired extends true ? TenantContext : TenantContext | undefined
}

export function requireTenantContext(): TenantContext {
  return getTenantContext({ required: true })
}

export function isPlaceholderTenantContext(context?: TenantContext | null): boolean {
  if (!context) {
    return false
  }
  if (context.isPlaceholder) {
    return true
  }
  const slug = context.tenant.slug?.toLowerCase()
  return slug === PLACEHOLDER_TENANT_SLUG
}
