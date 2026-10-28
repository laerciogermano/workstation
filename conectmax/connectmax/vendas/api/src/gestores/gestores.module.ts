import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { Agente } from '../agentes/agente.entity';
import { GestorAgente } from './gestor-agente.entity';
import { GestoresController } from './gestores.controller';
import { GestoresService } from './gestores.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, GestorAgente, Agente])],
  controllers: [GestoresController],
  providers: [GestoresService],
  exports: [GestoresService],
})
export class GestoresModule {}
