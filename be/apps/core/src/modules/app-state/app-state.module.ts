import { Module } from '@afilmory/framework'

import { DatabaseModule } from '../../database/database.module'
import { AppStateService } from './app-state.service'

@Module({
  imports: [DatabaseModule],
  providers: [AppStateService],
})
export class AppStateModule {}
