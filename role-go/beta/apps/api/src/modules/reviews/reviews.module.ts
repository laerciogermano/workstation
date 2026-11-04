import { Module } from '@nestjs/common';
import { EventsModule } from '../events';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({ imports: [EventsModule], controllers: [ReviewsController], providers: [ReviewsService] })
export class ReviewsModule {}
