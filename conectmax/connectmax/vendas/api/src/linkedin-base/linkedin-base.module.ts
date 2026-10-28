import { Module } from '@nestjs/common';
import { ClientConnectionsLinkedinModule } from '../client-connections-linkedin/client-connections-linkedin.module';
import { ClientLinkedinMessagesModule } from '../client-linkedin-messages/client-linkedin-messages.module';
import { LinkedinBaseController } from './linkedin-base.controller';

@Module({
  imports: [ClientConnectionsLinkedinModule, ClientLinkedinMessagesModule],
  controllers: [LinkedinBaseController],
})
export class LinkedinBaseModule {}
