import { APP_GUARD, APP_INTERCEPTOR, APP_MIDDLEWARE, EventModule, Module } from '@afilmory/framework'
import { TransactionInterceptor } from 'core/database/transaction.interceptor'
import { AuthGuard } from 'core/guards/auth.guard'
import { CorsMiddleware } from 'core/middlewares/cors.middleware'
import { RedisAccessor } from 'core/redis/redis.provider'

import { DatabaseModule } from '../database/database.module'
import { RedisModule } from '../redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { OnboardingModule } from './onboarding/onboarding.module'
import { PhotoModule } from './photo/photo.module'
import { SettingModule } from './setting/setting.module'

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    AuthModule,
    SettingModule,
    OnboardingModule,
    PhotoModule,
    EventModule.forRootAsync({
      useFactory: async (redis: RedisAccessor) => {
        return {
          redisClient: redis.get(),
        }
      },
      inject: [RedisAccessor],
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
    {
      provide: APP_MIDDLEWARE,
      useClass: CorsMiddleware,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModules {}
