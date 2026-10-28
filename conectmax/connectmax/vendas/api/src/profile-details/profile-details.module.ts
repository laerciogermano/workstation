import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { ProfileDetailsController } from './profile-details.controller';
import { ProfileDetailsService } from './profile-details.service';

@Module({
  imports: [ClientesModule],
  controllers: [ProfileDetailsController],
  providers: [ProfileDetailsService],
  exports: [ProfileDetailsService],
})
export class ProfileDetailsModule {}
