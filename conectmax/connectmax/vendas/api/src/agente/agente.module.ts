import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agente } from '../agentes/agente.entity';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import { ClientLinkedinMessage } from '../client-linkedin-messages/client-linkedin-message.entity';
import { AgentJob } from './agent-job.entity';
import { AgentRuntime } from './agent-runtime.entity';
import { AgenteController } from './agente.controller';
import { AgenteService } from './agente.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentJob,
      AgentRuntime,
      ClientConnectionLinkedin,
      ClientLinkedinMessage,
      ClienteLinkedin,
      Agente,
    ]),
  ],
  controllers: [AgenteController],
  providers: [AgenteService],
  exports: [AgenteService],
})
export class AgenteModule {}
