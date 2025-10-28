import { authUsers } from '@afilmory/db'
import { BizException, ErrorCode } from 'core/errors'
import { sql } from 'drizzle-orm'
import { injectable } from 'tsyringe'
import type { ZodType } from 'zod'

import { DbAccessor } from '../../database/database.provider'
import { SUPER_ADMIN_SETTING_DEFINITIONS, SUPER_ADMIN_SETTING_KEYS } from './super-admin-setting.constants'
import type {
  SuperAdminSettings,
  SuperAdminSettingsOverview,
  SuperAdminSettingsStats,
  UpdateSuperAdminSettingsInput,
} from './super-admin-setting.types'
import { SUPER_ADMIN_SETTING_UI_SCHEMA } from './super-admin-setting.ui-schema'
import { SystemSettingService } from './system-setting.service'

@injectable()
export class SuperAdminSettingService {
  constructor(
    private readonly systemSettingService: SystemSettingService,
    private readonly dbAccessor: DbAccessor,
  ) {}

  async getSettings(): Promise<SuperAdminSettings> {
    const rawValues = await this.systemSettingService.getMany(SUPER_ADMIN_SETTING_KEYS)

    const allowRegistration = this.parseSetting(
      rawValues[SUPER_ADMIN_SETTING_DEFINITIONS.allowRegistration.key],
      SUPER_ADMIN_SETTING_DEFINITIONS.allowRegistration.schema,
      SUPER_ADMIN_SETTING_DEFINITIONS.allowRegistration.defaultValue,
    )

    const maxRegistrableUsers = this.parseSetting(
      rawValues[SUPER_ADMIN_SETTING_DEFINITIONS.maxRegistrableUsers.key],
      SUPER_ADMIN_SETTING_DEFINITIONS.maxRegistrableUsers.schema,
      SUPER_ADMIN_SETTING_DEFINITIONS.maxRegistrableUsers.defaultValue,
    )

    const localProviderEnabled = this.parseSetting(
      rawValues[SUPER_ADMIN_SETTING_DEFINITIONS.localProviderEnabled.key],
      SUPER_ADMIN_SETTING_DEFINITIONS.localProviderEnabled.schema,
      SUPER_ADMIN_SETTING_DEFINITIONS.localProviderEnabled.defaultValue,
    )

    return {
      allowRegistration,
      maxRegistrableUsers,
      localProviderEnabled,
    }
  }

  async getStats(): Promise<SuperAdminSettingsStats> {
    const settings = await this.getSettings()
    const totalUsers = await this.getTotalUserCount()
    return this.buildStats(settings, totalUsers)
  }

  async getOverview(): Promise<SuperAdminSettingsOverview> {
    const values = await this.getSettings()
    const totalUsers = await this.getTotalUserCount()
    const stats = this.buildStats(values, totalUsers)
    return {
      schema: SUPER_ADMIN_SETTING_UI_SCHEMA,
      values,
      stats,
    }
  }

  async updateSettings(patch: UpdateSuperAdminSettingsInput): Promise<SuperAdminSettings> {
    if (!patch || Object.values(patch).every((value) => value === undefined)) {
      return await this.getSettings()
    }

    const current = await this.getSettings()
    const updates: Array<{ key: string; value: SuperAdminSettings[keyof SuperAdminSettings] | null }> = []

    if (patch.allowRegistration !== undefined && patch.allowRegistration !== current.allowRegistration) {
      updates.push({
        key: SUPER_ADMIN_SETTING_DEFINITIONS.allowRegistration.key,
        value: patch.allowRegistration,
      })
      current.allowRegistration = patch.allowRegistration
    }

    if (patch.localProviderEnabled !== undefined && patch.localProviderEnabled !== current.localProviderEnabled) {
      updates.push({
        key: SUPER_ADMIN_SETTING_DEFINITIONS.localProviderEnabled.key,
        value: patch.localProviderEnabled,
      })
      current.localProviderEnabled = patch.localProviderEnabled
    }

    if (patch.maxRegistrableUsers !== undefined) {
      const normalized = patch.maxRegistrableUsers === null ? null : Math.max(0, Math.trunc(patch.maxRegistrableUsers))
      if (normalized !== current.maxRegistrableUsers) {
        if (normalized !== null) {
          const totalUsers = await this.getTotalUserCount()
          if (normalized < totalUsers) {
            throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
              message: '最大可注册用户数不能小于当前用户总数',
            })
          }
        }

        updates.push({
          key: SUPER_ADMIN_SETTING_DEFINITIONS.maxRegistrableUsers.key,
          value: normalized,
        })
        current.maxRegistrableUsers = normalized
      }
    }

    if (updates.length === 0) {
      return current
    }

    await this.systemSettingService.setMany(
      updates.map((entry) => ({
        key: entry.key,
        value: entry.value,
      })),
    )

    return current
  }

  private parseSetting<T>(raw: unknown, schema: ZodType<T>, defaultValue: T): T {
    if (raw === null || raw === undefined) {
      return defaultValue
    }

    const parsed = schema.safeParse(raw)
    return parsed.success ? parsed.data : defaultValue
  }

  private buildStats(settings: SuperAdminSettings, totalUsers: number): SuperAdminSettingsStats {
    const remaining =
      settings.maxRegistrableUsers === null ? null : Math.max(settings.maxRegistrableUsers - totalUsers, 0)

    return {
      totalUsers,
      registrationsRemaining: remaining,
    }
  }

  private async getTotalUserCount(): Promise<number> {
    const db = this.dbAccessor.get()
    const [row] = await db.select({ total: sql<number>`count(*)` }).from(authUsers)
    return typeof row?.total === 'number' ? row.total : Number(row?.total ?? 0)
  }
}
