import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteLinkedin, ClientConnectionLinkedin]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
