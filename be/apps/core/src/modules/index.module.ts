import { APP_GUARD, APP_MIDDLEWARE, EventModule, Module } from '@afilmory/framework'
import { AuthGuard } from 'core/guards/auth.guard'
import { CorsMiddleware } from 'core/middlewares/cors.middleware'
import { DatabaseContextMiddleware } from 'core/middlewares/database-context.middleware'
import { TenantResolverMiddleware } from 'core/middlewares/tenant-resolver.middleware'
import { RedisAccessor } from 'core/redis/redis.provider'

import { DatabaseModule } from '../database/database.module'
import { RedisModule } from '../redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { DataSyncModule } from './data-sync/data-sync.module'
import { OnboardingModule } from './onboarding/onboarding.module'
import { PhotoModule } from './photo/photo.module'
import { SettingModule } from './setting/setting.module'
import { SuperAdminModule } from './super-admin/super-admin.module'
import { SystemSettingModule } from './system-setting/system-setting.module'
import { TenantModule } from './tenant/tenant.module'

function createEventModuleOptions(redis: RedisAccessor) {
  return {
    redisClient: redis.get(),
  }
}

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    AuthModule,
    SettingModule,
    SystemSettingModule,
    SuperAdminModule,
    OnboardingModule,
    PhotoModule,
    TenantModule,
    DataSyncModule,
    EventModule.forRootAsync({
      useFactory: createEventModuleOptions,
      inject: [RedisAccessor],
    }),
  ],
  providers: [
    {
      provide: APP_MIDDLEWARE,
      useClass: CorsMiddleware,
    },
    {
      provide: APP_MIDDLEWARE,
      useClass: TenantResolverMiddleware,
    },
    {
      provide: APP_MIDDLEWARE,
      useClass: DatabaseContextMiddleware,
    },

    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModules {}
