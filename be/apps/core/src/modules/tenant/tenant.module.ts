import './tenant.context'

import { Module } from '@afilmory/framework'
import { DatabaseModule } from 'core/database/database.module'

import { TenantRepository } from './tenant.repository'
import { TenantService } from './tenant.service'

@Module({
  imports: [DatabaseModule],
  providers: [TenantRepository, TenantService],
})
export class TenantModule {}
