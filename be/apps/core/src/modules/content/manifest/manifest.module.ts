import { Module } from '@afilmory/framework'

import { ManifestPublicController } from './manifest.public.controller'
import { ManifestService } from './manifest.service'

@Module({
  controllers: [ManifestPublicController],
  providers: [ManifestService],
})
export class ManifestModule {}
