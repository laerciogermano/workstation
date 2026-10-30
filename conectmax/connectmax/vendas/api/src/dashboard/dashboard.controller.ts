import { Controller, Get } from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@Resource('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Insights para o SPA `/dashboard`.
   * Path dedicado (`/dashboard/insights`) — evita conflito SPA+API no mesmo URL
   * (nginx/Vite devolviam `index.html` → parse JSON quebrava).
   * `GET /dashboard` permanece como alias.
   */
  @Get('insights')
  insights() {
    return this.dashboardService.insights();
  }

  /** @deprecated Preferir `GET /dashboard/insights` (sem colidir com a rota SPA). */
  @Get()
  insightsAlias() {
    return this.dashboardService.insights();
  }
}
