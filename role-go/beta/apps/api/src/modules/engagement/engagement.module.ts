import { Module } from '@nestjs/common';
import { EventsModule } from '../events';
import { EngagementService } from './application/engagement.service';
import { EngagementController } from './http/engagement.controller';

@Module({ imports: [EventsModule], controllers: [EngagementController], providers: [EngagementService], exports: [EngagementService] })
export class EngagementModule {}
