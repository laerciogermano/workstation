import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GestorAgente } from '../gestores/gestor-agente.entity';
import { Agente } from './agente.entity';
import { AgentesController } from './agentes.controller';
import { AgentesService } from './agentes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agente, GestorAgente])],
  controllers: [AgentesController],
  providers: [AgentesService],
  exports: [AgentesService],
})
export class AgentesModule {}
