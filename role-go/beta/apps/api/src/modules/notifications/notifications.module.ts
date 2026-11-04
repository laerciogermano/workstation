import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile';
import { NotificationHandlers } from './notifications.handlers';

@Module({ imports: [ProfileModule], providers: [NotificationHandlers], exports: [NotificationHandlers] })
export class NotificationsModule {}
