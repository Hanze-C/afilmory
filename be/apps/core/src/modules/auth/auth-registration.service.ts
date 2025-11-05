import { authUsers } from '@afilmory/db'
import { BizException, ErrorCode } from 'core/errors'
import { eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import { DbAccessor } from '../../database/database.provider'
import { SuperAdminSettingService } from '../system-setting/super-admin-setting.service'
import { TenantRepository } from '../tenant/tenant.repository'
import { TenantService } from '../tenant/tenant.service'
import type { TenantRecord } from '../tenant/tenant.types'
import { AuthProvider } from './auth.provider'

type RegisterTenantAccountInput = {
  email: string
  password: string
  name: string
}

type RegisterTenantInput = {
  account: RegisterTenantAccountInput
  tenant: {
    name: string
    slug?: string | null
  }
}

export interface RegisterTenantResult {
  response: Response
  tenant?: TenantRecord
  accountId?: string
  success: boolean
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

@injectable()
export class AuthRegistrationService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly tenantService: TenantService,
    private readonly tenantRepository: TenantRepository,
    private readonly superAdminSettings: SuperAdminSettingService,
    private readonly dbAccessor: DbAccessor,
  ) {}

  async registerTenant(input: RegisterTenantInput, headers: Headers): Promise<RegisterTenantResult> {
    await this.superAdminSettings.ensureRegistrationAllowed()

    const accountEmail = input.account.email.trim().toLowerCase()
    const accountPassword = input.account.password
    const accountName = input.account.name.trim() || accountEmail

    if (!accountEmail) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '邮箱不能为空' })
    }

    if (accountPassword.trim().length < 8) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
        message: '密码长度至少需要 8 个字符',
      })
    }

    const tenantName = input.tenant.name.trim()
    if (!tenantName) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '租户名称不能为空' })
    }

    const slugBase = input.tenant.slug?.trim() ? slugify(input.tenant.slug) : slugify(tenantName)
    if (!slugBase) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, { message: '租户标识不能为空' })
    }

    const slug = await this.generateUniqueSlug(slugBase)

    let tenantId: string | null = null
    try {
      const tenantAggregate = await this.tenantService.createTenant({
        name: tenantName,
        slug,
      })
      tenantId = tenantAggregate.tenant.id

      const auth = this.authProvider.getAuth()
      const response = await auth.api.signUpEmail({
        body: {
          email: accountEmail,
          password: accountPassword,
          name: accountName,
        },
        headers,
        asResponse: true,
      })

      if (!response.ok) {
        if (tenantId) {
          await this.tenantService.deleteTenant(tenantId).catch(() => {})
          tenantId = null
        }
        return { response, success: false }
      }

      let userId: string | undefined
      try {
        const payload = (await response.clone().json()) as { user?: { id?: string } } | null
        userId = payload?.user?.id
      } catch {
        userId = undefined
      }

      if (!userId) {
        if (tenantId) {
          await this.tenantService.deleteTenant(tenantId).catch(() => {})
          tenantId = null
        }
        throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
          message: '注册成功但未返回用户信息，请稍后重试。',
        })
      }

      const db = this.dbAccessor.get()
      await db.update(authUsers).set({ tenantId, role: 'admin' }).where(eq(authUsers.id, userId))

      const refreshed = await this.tenantService.getById(tenantId)

      return {
        response,
        tenant: refreshed.tenant,
        accountId: userId,
        success: true,
      }
    } catch (error) {
      if (tenantId) {
        await this.tenantService.deleteTenant(tenantId).catch(() => {})
      }
      throw error
    }
  }

  private async generateUniqueSlug(base: string): Promise<string> {
    const sanitizedBase = base.length > 0 ? base : 'tenant'

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = attempt === 0 ? sanitizedBase : `${sanitizedBase}-${attempt + 1}`
      const existing = await this.tenantRepository.findBySlug(candidate)
      if (!existing) {
        return candidate
      }
    }

    throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
      message: '无法生成唯一的租户标识，请尝试使用不同的名称',
    })
  }
}
