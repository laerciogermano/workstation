import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { ClientConnectionLinkedin } from './client-connection-linkedin.entity';
import { ClientConnectionsLinkedinController } from './client-connections-linkedin.controller';
import { ClientConnectionsLinkedinService } from './client-connections-linkedin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientConnectionLinkedin,
      ClienteLinkedin,
      Cliente,
    ]),
  ],
  controllers: [ClientConnectionsLinkedinController],
  providers: [ClientConnectionsLinkedinService],
  exports: [ClientConnectionsLinkedinService],
})
export class ClientConnectionsLinkedinModule {}
