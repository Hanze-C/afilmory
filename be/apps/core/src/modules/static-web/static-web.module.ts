import { Module } from '@afilmory/framework'

import { StaticDashboardService } from './static-dashboard.service'
import { StaticWebController } from './static-web.controller'
import { StaticWebService } from './static-web.service'
import { StaticWebManifestService } from './static-web-manifest.service'

@Module({
  controllers: [StaticWebController],
  providers: [StaticWebService, StaticWebManifestService, StaticDashboardService],
})
export class StaticWebModule {}
