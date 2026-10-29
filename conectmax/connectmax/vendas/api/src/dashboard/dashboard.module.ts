import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentJob } from '../agente/agent-job.entity';
import { AgentRuntime } from '../agente/agent-runtime.entity';
import { Agente } from '../agentes/agente.entity';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import { ClientLinkedinMessage } from '../client-linkedin-messages/client-linkedin-message.entity';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClienteLinkedin,
      ClientConnectionLinkedin,
      ClientLinkedinMessage,
      AgentJob,
      Agente,
      AgentRuntime,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
