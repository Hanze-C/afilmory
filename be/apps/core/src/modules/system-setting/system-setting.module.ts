import { Module } from '@afilmory/framework'

import { DatabaseModule } from '../../database/database.module'
import { SuperAdminSettingService } from './super-admin-setting.service'
import { SystemSettingService } from './system-setting.service'

@Module({
  imports: [DatabaseModule],
  providers: [SystemSettingService, SuperAdminSettingService],
})
export class SystemSettingModule {}
