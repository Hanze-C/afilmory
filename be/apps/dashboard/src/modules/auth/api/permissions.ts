import { coreApi } from '~/lib/api-client'

type PermissionResponse = {
  allowed: boolean
}

export async function checkDashboardAccess(): Promise<PermissionResponse> {
  return coreApi<PermissionResponse>('/auth/permissions/dashboard', { method: 'GET' })
}

export async function checkSuperAdminAccess(): Promise<PermissionResponse> {
  return coreApi<PermissionResponse>('/auth/permissions/superadmin', { method: 'GET' })
}
