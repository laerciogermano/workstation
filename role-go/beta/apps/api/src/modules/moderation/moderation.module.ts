import { Module } from '@nestjs/common';
import { EventsModule } from '../events';
import { OrganizerModule } from '../organizer';
import { AdminController, ReportsController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({ imports: [EventsModule, OrganizerModule], controllers: [ReportsController, AdminController], providers: [ModerationService] })
export class ModerationModule {}
