import { Module } from '@nestjs/common';
import { EventsModule } from '../events';
import { DiscoveryService } from './application/discovery.service';
import { DiscoveryController } from './http/discovery.controller';

@Module({ imports: [EventsModule], controllers: [DiscoveryController], providers: [DiscoveryService] })
export class DiscoveryModule {}
