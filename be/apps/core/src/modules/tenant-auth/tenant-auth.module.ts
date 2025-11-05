import { Module } from '@afilmory/framework'

import { DatabaseModule } from '../../database/database.module'
import { SettingModule } from '../setting/setting.module'
import { TenantAuthConfigService } from './tenant-auth.config'
import { TenantAuthController } from './tenant-auth.controller'
import { TenantAuthProvider } from './tenant-auth.provider'

@Module({
  imports: [DatabaseModule, SettingModule],
  controllers: [TenantAuthController],
  providers: [TenantAuthProvider, TenantAuthConfigService],
})
export class TenantAuthModule {}
