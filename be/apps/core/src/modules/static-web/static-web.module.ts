import { Module } from '@afilmory/framework'

import { StaticWebController } from './static-web.controller'
import { StaticWebService } from './static-web.service'
import { StaticWebManifestService } from './static-web-manifest.service'

@Module({
  controllers: [StaticWebController],
  providers: [StaticWebService, StaticWebManifestService],
})
export class StaticWebModule {}
