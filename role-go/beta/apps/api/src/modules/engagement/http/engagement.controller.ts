import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessCodeBody, type Counts, type EventCard, type Guest, GuestsQuery, MyRsvpsQuery, type Page, PeopleQuery, type PersonRef, RsvpBody, type RsvpResult, type RsvpStatus } from '@rolego/contracts';
import type { Response } from 'express';
import { CurrentViewer, OptionalViewer, Public, type Viewer } from '../../../shared/auth/viewer';
import { unwrap } from '../../../shared/errors/app-error';
import { UuidPipe } from '../../../shared/http/uuid.pipe';
import { parseOrThrow, ZQuery } from '../../../shared/http/zod';
import { EngagementService } from '../application/engagement.service';

@Controller()
export class EngagementController {
  constructor(private readonly svc: EngagementService) {}

  @Put('events/:id/interest')
  async like(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<{ interested: boolean; counts: Counts }> {
    return unwrap(await this.svc.setInterest(v, id, true));
  }

  @Delete('events/:id/interest')
  async unlike(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<{ interested: boolean; counts: Counts }> {
    return unwrap(await this.svc.setInterest(v, id, false));
  }

  @Put('events/:id/pass')
  @HttpCode(204)
  async pass(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<void> {
    unwrap(await this.svc.setPass(v, id, true));
  }

  @Delete('events/:id/pass')
  @HttpCode(204)
  async unpass(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<void> {
    unwrap(await this.svc.setPass(v, id, false));
  }

  @Post('events/:id/rsvp')
  @HttpCode(200)
  async rsvp(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<RsvpResult> {
    return unwrap(await this.svc.rsvp(v, id, parseOrThrow(RsvpBody, body).accessCode ?? null));
  }

  @Delete('events/:id/rsvp')
  async cancel(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<RsvpResult> {
    return unwrap(await this.svc.cancelRsvp(v, id));
  }

  @Post('events/:id/here')
  @HttpCode(204)
  async here(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<void> {
    unwrap(await this.svc.here(v, id));
  }

  @Post('events/access-code')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  async code(@Body() body: unknown): Promise<{ slug: string }> {
    return unwrap(await this.svc.byAccessCode(parseOrThrow(AccessCodeBody, body).code));
  }

  @Public()
  @Get('events/:id/people')
  async people(@OptionalViewer() v: Viewer | null, @Param('id', UuidPipe) id: string, @ZQuery(PeopleQuery) q: { kind: 'going' | 'interested'; cursor?: string }): Promise<Page<PersonRef> & { hiddenCount: number; total: number }> {
    return unwrap(await this.svc.people(v, id, q.kind, q.cursor));
  }

  @Public()
  @Get('events/:id/calendar.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async ics(@OptionalViewer() v: Viewer | null, @Param('id', UuidPipe) id: string, @Res({ passthrough: true }) res: Response): Promise<string> {
    res.setHeader('Content-Disposition', 'attachment; filename="role.ics"');
    return unwrap(await this.svc.ics(id, v));
  }

  @Get('events/:id/guests')
  async guests(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @ZQuery(GuestsQuery) q: { status: 'pending' | 'going' }): Promise<Page<Guest>> {
    return unwrap(await this.svc.guests(v, id, q.status));
  }

  @Post('events/:id/guests/approve-all')
  @HttpCode(200)
  async approveAll(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<{ approved: number; leftPending: number }> {
    return unwrap(await this.svc.approveAll(v, id));
  }

  @Post('events/:id/guests/:userId/approve')
  @HttpCode(200)
  async approve(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Param('userId', UuidPipe) userId: string): Promise<Guest> {
    return unwrap(await this.svc.decideGuest(v, id, userId, true));
  }

  @Post('events/:id/guests/:userId/decline')
  @HttpCode(200)
  async decline(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Param('userId', UuidPipe) userId: string): Promise<Guest> {
    return unwrap(await this.svc.decideGuest(v, id, userId, false));
  }

  @Get('me/rsvps')
  myRsvps(@CurrentViewer() v: Viewer, @ZQuery(MyRsvpsQuery) q: { scope: 'upcoming' | 'past' }): Promise<Page<EventCard & { rsvpStatus: RsvpStatus }>> {
    return this.svc.myRsvps(v, q.scope);
  }
}
