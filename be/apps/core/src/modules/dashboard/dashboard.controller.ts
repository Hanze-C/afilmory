import { Controller, Get } from '@afilmory/framework'
import { Roles } from 'core/guards/roles.decorator'

import { DashboardService } from './dashboard.service'

@Controller('dashboard')
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    return await this.dashboardService.getOverview()
  }
}
