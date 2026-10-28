import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agente } from '../agentes/agente.entity';
import { ContaLinkedin } from './conta-linkedin.entity';
import { ContasLinkedinController } from './contas-linkedin.controller';
import { ContasLinkedinService } from './contas-linkedin.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContaLinkedin, Agente])],
  controllers: [ContasLinkedinController],
  providers: [ContasLinkedinService],
  exports: [ContasLinkedinService],
})
export class ContasLinkedinModule {}
