import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  CancelBody,
  EventDraftInput,
  type EventDetail,
  EventPatchInput,
  GeocodeBody,
  type MediaRef,
  OrganizerEventsQuery,
  type OrganizerEventCard,
  type OrganizerPublic,
  type PublishCheck,
  type VenuePreview,
  type EventCard,
} from '@rolego/contracts';
import { CurrentViewer, OptionalViewer, Public, type Viewer } from '../../../shared/auth/viewer';
import { unwrap } from '../../../shared/errors/app-error';
import { UuidPipe } from '../../../shared/http/uuid.pipe';
import { parseOrThrow, ZQuery } from '../../../shared/http/zod';
import { EventsService } from '../application/events.service';

const coverUpload = FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } });
const galleryUpload = FilesInterceptor('files', 20, { limits: { fileSize: 8 * 1024 * 1024 } });
const UPLOAD_LIMIT = { default: { limit: 20, ttl: 3600_000 } };

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Public()
  @Get('events/by-slug/:slug')
  async bySlug(@Param('slug') slug: string, @Query('c') code: string | undefined, @OptionalViewer() v: Viewer | null): Promise<EventDetail> {
    return unwrap(await this.events.bySlug(slug.slice(0, 120), v, code?.slice(0, 12) ?? null));
  }

  @Public()
  @Get('events/:id/editions')
  editions(@Param('id', UuidPipe) id: string, @OptionalViewer() v: Viewer | null): Promise<{ editions: EventCard[]; photos: MediaRef[] }> {
    return this.events.editions(id, v);
  }

  @Public()
  @Get('organizers/:slug')
  async organizer(@Param('slug') slug: string, @OptionalViewer() v: Viewer | null): Promise<OrganizerPublic> {
    return unwrap(await this.events.organizerPage(slug, v));
  }

  @Get('organizer/events')
  async mine(@CurrentViewer() v: Viewer, @ZQuery(OrganizerEventsQuery) q: { tab: 'upcoming' | 'drafts' | 'past' }): Promise<{ items: OrganizerEventCard[]; nextCursor: null }> {
    return { items: unwrap(await this.events.organizerEvents(v, q.tab)), nextCursor: null };
  }

  /** Detalhe para o dono/admin (wizard de edição). */
  @Get('events/:id')
  async owned(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<EventDetail> {
    unwrap(await this.events.loadOwned(id, v));
    return this.events.ownerDetail(id, v);
  }

  @Post('events')
  async create(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<EventDetail> {
    const id = unwrap(await this.events.createDraft(v, parseOrThrow(EventDraftInput, body)));
    return this.events.ownerDetail(id, v);
  }

  @Patch('events/:id')
  async patch(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<EventDetail & { notifiesGoing: number }> {
    const r = unwrap(await this.events.patch(id, v, parseOrThrow(EventPatchInput, body)));
    return { ...(await this.events.ownerDetail(id, v)), notifiesGoing: r.notifiesGoing };
  }

  @Put('events/:id/cover')
  @Throttle(UPLOAD_LIMIT)
  @UseInterceptors(coverUpload)
  async cover(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @UploadedFile() file: Express.Multer.File | undefined): Promise<EventDetail> {
    unwrap(await this.events.setCover(id, v, file?.buffer));
    return this.events.ownerDetail(id, v);
  }

  @Post('events/:id/geocode')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async geocode(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<VenuePreview & { notifiesGoing: number }> {
    return unwrap(await this.events.geocode(id, v, parseOrThrow(GeocodeBody, body)));
  }

  @Get('events/:id/publish-check')
  async check(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<PublishCheck> {
    return unwrap(await this.events.publishCheckFor(id, v));
  }

  @Post('events/:id/publish')
  @HttpCode(200)
  async publish(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<EventDetail> {
    unwrap(await this.events.publish(id, v));
    return this.events.ownerDetail(id, v);
  }

  @Post('events/:id/cancel')
  @HttpCode(200)
  async cancel(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Body() body: unknown): Promise<EventDetail> {
    unwrap(await this.events.cancel(id, v, parseOrThrow(CancelBody, body).reason));
    return this.events.ownerDetail(id, v);
  }

  @Delete('events/:id')
  @HttpCode(204)
  async remove(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<void> {
    unwrap(await this.events.deleteDraft(id, v));
  }

  @Post('events/:id/editions')
  async edition(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string): Promise<EventDetail> {
    const newId = unwrap(await this.events.newEdition(id, v));
    return this.events.ownerDetail(newId, v);
  }

  @Post('events/:id/gallery')
  @Throttle(UPLOAD_LIMIT)
  @UseInterceptors(galleryUpload)
  async addGallery(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @UploadedFiles() files: Express.Multer.File[] | undefined): Promise<MediaRef[]> {
    return unwrap(await this.events.addGallery(id, v, (files ?? []).map((f) => f.buffer)));
  }

  @Delete('events/:id/gallery/:assetId')
  @HttpCode(204)
  async removeGallery(@CurrentViewer() v: Viewer, @Param('id', UuidPipe) id: string, @Param('assetId', UuidPipe) assetId: string): Promise<void> {
    unwrap(await this.events.removeGallery(id, v, assetId));
  }
}
