import { Module } from '@nestjs/common';
import { OrganizerModule } from '../organizer';
import { EventsService } from './application/events.service';
import { OriginResolver } from './application/origin';
import { EventsController } from './http/events.controller';

@Module({ imports: [OrganizerModule], controllers: [EventsController], providers: [EventsService, OriginResolver], exports: [EventsService, OriginResolver] })
export class EventsModule {}
