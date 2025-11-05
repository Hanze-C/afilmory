import { APP_GUARD, APP_INTERCEPTOR, APP_MIDDLEWARE, EventModule, Module } from '@afilmory/framework'
import { AuthGuard } from 'core/guards/auth.guard'
import { TenantResolverInterceptor } from 'core/interceptors/tenant-resolver.interceptor'
import { CorsMiddleware } from 'core/middlewares/cors.middleware'
import { DatabaseContextMiddleware } from 'core/middlewares/database-context.middleware'
import { RedisAccessor } from 'core/redis/redis.provider'

import { DatabaseModule } from '../database/database.module'
import { RedisModule } from '../redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { DataSyncModule } from './data-sync/data-sync.module'
import { OnboardingModule } from './onboarding/onboarding.module'
import { PhotoModule } from './photo/photo.module'
import { ReactionModule } from './reaction/reaction.module'
import { SettingModule } from './setting/setting.module'
import { StaticWebModule } from './static-web/static-web.module'
import { SuperAdminModule } from './super-admin/super-admin.module'
import { SystemSettingModule } from './system-setting/system-setting.module'
import { TenantModule } from './tenant/tenant.module'
import { TenantAuthModule } from './tenant-auth/tenant-auth.module'

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
    ReactionModule,
    DashboardModule,
    TenantModule,
    TenantAuthModule,
    DataSyncModule,
    StaticWebModule,
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
      useClass: DatabaseContextMiddleware,
    },

    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantResolverInterceptor,
    },
  ],
})
export class AppModules {}
