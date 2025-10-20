import { Body, Controller, Delete, Get, Param, Post, Query } from '@afilmory/framework'
import { Roles } from 'core/guards/roles.decorator'
import { BypassResponseTransform } from 'core/interceptors/response-transform.decorator'

import { SettingKeys } from './setting.constant'
import { DeleteSettingDto, GetSettingDto, GetSettingsQueryDto, SetSettingDto } from './setting.dto'
import { SettingService } from './setting.service'

@Controller('settings')
@Roles('admin')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('/ui-schema')
  @BypassResponseTransform()
  async getUiSchema() {
    return await this.settingService.getUiSchema()
  }

  @Get('/:key')
  async get(@Param() { key }: GetSettingDto) {
    const value = await this.settingService.get(key, {})
    return { key, value }
  }

  @Get('/')
  async getMany(@Query() query: GetSettingsQueryDto) {
    const keys = query?.keys ?? []
    const targetKeys = keys.length > 0 ? keys : Array.from(SettingKeys)
    const values = await this.settingService.getMany(targetKeys, {})
    return { keys: targetKeys, values }
  }

  @Post('/')
  async set(@Body() { entries }: SetSettingDto) {
    await this.settingService.setMany(entries)
    return { updated: entries }
  }

  @Delete('/:key')
  async delete(@Param() { key }: GetSettingDto) {
    await this.settingService.delete(key)
    return { key, deleted: true }
  }

  @Delete('/')
  async deleteMany(@Body() { keys }: DeleteSettingDto) {
    await this.settingService.deleteMany(keys)
    return { keys, deleted: true }
  }
}
