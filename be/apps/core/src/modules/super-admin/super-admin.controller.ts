import { Body, Controller, Get, Patch } from '@afilmory/framework'
import { Roles } from 'core/guards/roles.decorator'
import { BypassResponseTransform } from 'core/interceptors/response-transform.decorator'

import { SuperAdminSettingService } from '../system-setting/super-admin-setting.service'
import { UpdateSuperAdminSettingsDto } from './super-admin.dto'

@Controller('super-admin/settings')
@Roles('superadmin')
export class SuperAdminSettingController {
  constructor(private readonly superAdminSettings: SuperAdminSettingService) {}

  @Get('/')
  @BypassResponseTransform()
  async getOverview() {
    return await this.superAdminSettings.getOverview()
  }

  @Patch('/')
  @BypassResponseTransform()
  async update(@Body() dto: UpdateSuperAdminSettingsDto) {
    await this.superAdminSettings.updateSettings(dto)
    return await this.superAdminSettings.getOverview()
  }
}
