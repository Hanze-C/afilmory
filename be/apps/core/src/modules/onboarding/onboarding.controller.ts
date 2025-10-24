import { Body, Controller, Get, Post } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'

import { OnboardingInitDto } from './onboarding.dto'
import { OnboardingService } from './onboarding.service'

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get('/status')
  async getStatus() {
    const initialized = await this.service.isInitialized()
    return { initialized }
  }

  @Post('/init')
  async initialize(@Body() dto: OnboardingInitDto) {
    const initialized = await this.service.isInitialized()
    if (initialized) {
      throw new BizException(ErrorCode.COMMON_CONFLICT, { message: 'Already initialized' })
    }
    const result = await this.service.initialize(dto)
    return {
      ok: true,
      adminUserId: result.adminUserId,
      tenantId: result.tenantId,
      superAdminUserId: result.superAdminUserId,
    }
  }
}
