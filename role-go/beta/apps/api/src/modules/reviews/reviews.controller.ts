import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { type EventCard, type Page, ReviewBody, type ReviewDto } from '@rolego/contracts';
import { CurrentViewer, OptionalViewer, Public, type Viewer } from '../../shared/auth/viewer';
import { unwrap } from '../../shared/errors/app-error';
import { UuidPipe } from '../../shared/http/uuid.pipe';
import { parseOrThrow } from '../../shared/http/zod';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Put('events/:id/review')
  async put(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<ReviewDto> {
    return unwrap(await this.reviews.upsert(v, id, parseOrThrow(ReviewBody, body)));
  }

  @Public()
  @Get('events/:id/reviews')
  list(@OptionalViewer() v: Viewer | null, @Param('id', UuidPipe) id: string, @Query('cursor') cursor?: string): Promise<Page<ReviewDto> & { avg: number; count: number }> {
    return this.reviews.page(id, v, cursor);
  }

  @Get('me/reviews/pending')
  pending(@CurrentViewer() v: Viewer): Promise<EventCard[]> {
    return this.reviews.pending(v);
  }
}
