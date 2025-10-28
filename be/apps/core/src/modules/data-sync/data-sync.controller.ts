import type { BuilderConfig, StorageConfig } from '@afilmory/builder'
import { Body, Controller, Get, Param, Post } from '@afilmory/framework'
import { Roles } from 'core/guards/roles.decorator'

import { ResolveConflictDto, ResolveConflictInput,RunDataSyncDto, RunDataSyncInput } from './data-sync.dto'
import { DataSyncService } from './data-sync.service'
import type { DataSyncAction, DataSyncConflict, DataSyncResult } from './data-sync.types'

@Controller('data-sync')
@Roles('admin')
export class DataSyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Post('run')
  async run(@Body() body: RunDataSyncDto): Promise<DataSyncResult> {
    const payload = body as unknown as RunDataSyncInput
    return await this.dataSyncService.runSync({
      builderConfig: payload.builderConfig as BuilderConfig,
      storageConfig: payload.storageConfig as StorageConfig | undefined,
      dryRun: payload.dryRun ?? false,
    })
  }

  @Get('conflicts')
  async listConflicts(): Promise<DataSyncConflict[]> {
    return await this.dataSyncService.listConflicts()
  }

  @Post('conflicts/:id/resolve')
  async resolve(@Param('id') id: string, @Body() body: ResolveConflictDto): Promise<DataSyncAction> {
    const payload = body as unknown as ResolveConflictInput
    return await this.dataSyncService.resolveConflict(id, {
      strategy: payload.strategy,
      builderConfig: payload.builderConfig as BuilderConfig | undefined,
      storageConfig: payload.storageConfig as StorageConfig | undefined,
      dryRun: payload.dryRun ?? false,
    })
  }
}
