import { Module } from '@afilmory/framework'
import { SystemSettingModule } from 'core/modules/configuration/system-setting/system-setting.module'
import { PhotoBuilderService } from 'core/modules/content/photo/builder/photo-builder.service'

import { SuperAdminBuilderDebugController } from './super-admin-builder.controller'
import { SuperAdminSettingController } from './super-admin-settings.controller'

@Module({
  imports: [SystemSettingModule],
  controllers: [SuperAdminSettingController, SuperAdminBuilderDebugController],
  providers: [PhotoBuilderService],
})
export class SuperAdminModule {}
