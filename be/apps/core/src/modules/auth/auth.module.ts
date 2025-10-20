import { Module } from '@afilmory/framework'
import { DatabaseModule } from 'core/database/database.module'

import { AuthConfig } from './auth.config'
import { AuthController } from './auth.controller'
import { AuthProvider } from './auth.provider'

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthProvider, AuthConfig],
})
export class AuthModule {}
