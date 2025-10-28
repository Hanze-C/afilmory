import { Module } from '@afilmory/framework'

import { SystemSettingModule } from '../system-setting/system-setting.module'
import { SuperAdminSettingController } from './super-admin.controller'

@Module({
  imports: [SystemSettingModule],
  controllers: [SuperAdminSettingController],
})
export class SuperAdminModule {}
