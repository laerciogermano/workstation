import { Module } from '@nestjs/common';
import { ClientConnectionsLinkedinModule } from '../client-connections-linkedin/client-connections-linkedin.module';
import { ClientesModule } from '../clientes/clientes.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [ClientesModule, ClientConnectionsLinkedinModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
