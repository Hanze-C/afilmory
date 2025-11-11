import { Module } from '@afilmory/framework'

import { AppStateModule } from '../infrastructure/app-state/app-state.module'
import { AuthModule } from '../platform/auth/auth.module'
import { RootAccountProvisioner } from '../platform/auth/root-account.service'
import { TenantModule } from '../platform/tenant/tenant.module'
import { AppInitializationProvider } from './app-initialization.provider'

@Module({
  imports: [AppStateModule, TenantModule, AuthModule],
  providers: [AppInitializationProvider, RootAccountProvisioner],
})
export class AppInitializationModule {}
