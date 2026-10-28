import { Controller, Get } from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@Resource('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Insights prontos para o SPA `/dashboard` (KPIs, barras, tabelas). */
  @Get()
  insights() {
    return this.dashboardService.insights();
  }
}
