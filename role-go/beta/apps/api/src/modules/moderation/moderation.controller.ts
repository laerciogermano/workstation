import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminOrganizerBody, type AdminReport, type AdminStats, BlockBody, EventDraftInput, type EventDetail, type OrganizerDto, ReportBody, ResolveReportBody } from '@rolego/contracts';
import { CurrentViewer, Roles, type Viewer } from '../../shared/auth/viewer';
import { unwrap } from '../../shared/errors/app-error';
import { UuidPipe } from '../../shared/http/uuid.pipe';
import { parseOrThrow } from '../../shared/http/zod';
import { EventsService } from '../events';
import { ModerationService } from './moderation.service';

@Controller()
export class ReportsController {
  constructor(private readonly mod: ModerationService) {}

  @Post('reports')
  @HttpCode(201)
  @Throttle({ default: { limit: 20, ttl: 86400_000 } })
  async report(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<void> {
    unwrap(await this.mod.report(v, parseOrThrow(ReportBody, body)));
  }
}

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(
    private readonly mod: ModerationService,
    private readonly events: EventsService,
  ) {}

  @Get('reports')
  reports(@Query('status') status?: string): Promise<AdminReport[]> {
    return this.mod.queue(status === 'resolved' || status === 'dismissed' ? status : 'open');
  }

  @Post('reports/:id/resolve')
  @HttpCode(204)
  async resolve(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<void> {
    const b = parseOrThrow(ResolveReportBody, body);
    unwrap(await this.mod.resolve(v, id, b.action, b.note));
  }

  @Post('users/:id/block')
  @HttpCode(204)
  async block(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<void> {
    unwrap(await this.mod.block(v, id, parseOrThrow(BlockBody, body).reason));
  }

  @Post('users/:id/unblock')
  @HttpCode(204)
  async unblock(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<void> {
    unwrap(await this.mod.unblock(v, id, parseOrThrow(BlockBody, body).reason));
  }

  @Get('organizers')
  organizers(): Promise<OrganizerDto[]> {
    return this.mod.listOrganizers();
  }

  @Post('organizers')
  createOrganizer(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<OrganizerDto> {
    return this.mod.createOrganizer(v, parseOrThrow(AdminOrganizerBody, body));
  }

  /** Curadoria: rascunho em nome do parceiro; depois segue o fluxo normal de edição/publicação (admin passa na policy). */
  @Post('organizers/:id/events')
  async createEvent(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<EventDetail> {
    const eventId = unwrap(await this.events.createDraft(v, parseOrThrow(EventDraftInput, body), id));
    return this.events.ownerDetail(eventId, v);
  }

  @Post('events/:id/restore')
  @HttpCode(204)
  async restore(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<void> {
    unwrap(await this.mod.restoreEvent(v, id));
  }

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.mod.stats();
  }
}
