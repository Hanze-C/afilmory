import { Controller, Post } from '@afilmory/framework'
import { Roles } from 'core/guards/roles.decorator'

import { DataManagementService } from './data-management.service'

@Controller('data-management')
@Roles('admin')
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  @Post('photo-assets/truncate')
  async truncatePhotoAssetRecords() {
    return await this.dataManagementService.clearPhotoAssetRecords()
  }
}
