import { Module } from '@afilmory/framework'

import { PhotoBuilderService } from './photo.service'

@Module({
  providers: [PhotoBuilderService],
})
export class PhotoModule {}
