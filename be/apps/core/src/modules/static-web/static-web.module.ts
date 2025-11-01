import { Module } from '@afilmory/framework'

import { StaticWebController } from './static-web.controller'
import { StaticWebService } from './static-web.service'

@Module({
  controllers: [StaticWebController],
  providers: [StaticWebService],
})
export class StaticWebModule {}
