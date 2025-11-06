import { Module } from '@afilmory/framework'

import { StaticDashboardService } from './static-dashboard.service'
import { StaticOgController } from './static-og.controller'
import { StaticOgService } from './static-og.service'
import { StaticWebController } from './static-web.controller'
import { StaticWebService } from './static-web.service'
import { StaticWebManifestService } from './static-web-manifest.service'

@Module({
  controllers: [StaticWebController, StaticOgController],
  providers: [StaticWebService, StaticWebManifestService, StaticDashboardService, StaticOgService],
})
export class StaticWebModule {}
