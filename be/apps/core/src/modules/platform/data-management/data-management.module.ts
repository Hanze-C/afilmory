import { Module } from '@afilmory/framework'

import { DataManagementController } from './data-management.controller'
import { DataManagementService } from './data-management.service'

@Module({
  controllers: [DataManagementController],
  providers: [DataManagementService],
})
export class DataManagementModule {}
