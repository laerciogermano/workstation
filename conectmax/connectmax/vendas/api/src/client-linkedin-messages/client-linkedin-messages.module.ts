import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { Cliente } from '../clientes/cliente.entity';
import { ClientLinkedinMessage } from './client-linkedin-message.entity';
import { ClientLinkedinMessagesController } from './client-linkedin-messages.controller';
import { ClientLinkedinMessagesService } from './client-linkedin-messages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientLinkedinMessage,
      ClienteLinkedin,
      Cliente,
      ClientConnectionLinkedin,
    ]),
  ],
  controllers: [ClientLinkedinMessagesController],
  providers: [ClientLinkedinMessagesService],
  exports: [ClientLinkedinMessagesService],
})
export class ClientLinkedinMessagesModule {}
