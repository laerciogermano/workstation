import { Inject, Injectable } from '@nestjs/common';
import {
  type EventCard,
  type EventDetail,
  type EventDraftInput,
  type EventPatchInput,
  type GeocodeBody,
  MAX_GALLERY,
  type MediaRef,
  type OrganizerEventCard,
  type OrganizerPublic,
  type PublishCheck,
  type VenuePreview,
} from '@rolego/contracts';
import { and, eq, sql } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import type { Viewer } from '../../../shared/auth/viewer';
import { audit } from '../../../shared/audit';
import { DB, rows, type Db, type DbOrTx } from '../../../shared/db/db';
import { eventMedia, events, eventSeries, organizers, rsvps, users, type MediaVariants } from '../../../shared/db/schema';
import { GeocodingPort } from '../../../shared/geo/geocoding';
import { JobQueue } from '../../../shared/jobs/job-queue';
import { Clock } from '../../../shared/kernel/clock';
import { newId, randomSuffix, slugify } from '../../../shared/kernel/ids';
import { err, ok, type Result } from '../../../shared/kernel/result';
import { MediaService } from '../../../shared/media/media.service';
import { mediaUrl } from '../../../shared/media/storage';
import { OrganizerService } from '../../organizer';
import {
  canEdit,
  generateAccessCode,
  phaseOf,
  publishCheck,
  reviewWindowOpen,
  scheduleChanged,
  validateTimeRange,
} from '../domain/event';
import { type EventRecord, findEventBy, findEvents } from '../infra/event-read';
import { canOpenEvent, isGoing } from './policies/access.policy';
import { OriginResolver } from './origin';
import { ratingFrom, toEventCard, toEventDetail, toOrganizerEventCard, viewerFor } from './presenters/event.presenter';

type EventRow = typeof events.$inferSelect;
type Owned = { event: EventRow; organizer: typeof organizers.$inferSelect };

@Injectable()
export class EventsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
    private readonly orgs: OrganizerService,
    private readonly media: MediaService,
    private readonly geo: GeocodingPort,
    private readonly jobs: JobQueue,
    private readonly origin: OriginResolver,
  ) {}

  // ---------- leitura ----------

  async record(where: ReturnType<typeof sql>, viewer: Viewer | null, db: DbOrTx = this.db): Promise<EventRecord | null> {
    const o = await this.origin.forUser(viewer?.userId ?? null);
    return findEventBy(db, { viewerId: viewer?.userId ?? null, origin: o.point }, where);
  }

  async cardById(id: string, viewer: Viewer | null): Promise<EventCard | null> {
    const rec = await this.record(sql`e.id = ${id}`, viewer);
    return rec ? toEventCard(rec, viewerFor(rec, viewer), this.clock.now()) : null;
  }

  async detail(rec: EventRecord, viewer: Viewer | null): Promise<EventDetail> {
    const now = this.clock.now();
    const v = viewerFor(rec, viewer);
    const [gallery, interested, orgStats] = await Promise.all([
      this.gallery(rec.id),
      rows<{ id: string; name: string; photo: MediaVariants | null }>(
        this.db,
        sql`SELECT u.id, u.name, m.variants AS photo FROM interests i JOIN users u ON u.id = i.user_id
            LEFT JOIN media_assets m ON m.id = u.photo_asset_id
            WHERE i.event_id = ${rec.id} AND u.show_presence AND u.status = 'active' ORDER BY i.created_at DESC LIMIT 5`,
      ),
      rows<{ sum: number; count: number; events: number }>(
        this.db,
        sql`SELECT coalesce(sum(rating_sum),0)::int AS sum, coalesce(sum(rating_count),0)::int AS count,
              count(*) FILTER (WHERE status = 'published')::int AS events
            FROM events WHERE organizer_id = ${rec.organizerId}`,
      ),
    ]);
    const s = orgStats[0] ?? { sum: 0, count: 0, events: 0 };
    return toEventDetail(rec, v, now, {
      gallery,
      peopleInterested: interested,
      organizerRating: s.count >= 3 ? ratingFrom(s.sum, s.count) : null,
      organizerEventsCount: s.events,
      canReview: rec.endsAt !== null && rec.status === 'published' && reviewWindowOpen(rec.endsAt, now),
    });
  }

  async bySlug(slug: string, viewer: Viewer | null, code: string | null): Promise<Result<EventDetail>> {
    const rec = await this.record(sql`e.slug = ${slug}`, viewer);
    if (!rec) return err('NOT_FOUND');
    const v = viewerFor(rec, viewer);
    if (!canOpenEvent(v, rec, code)) return err('NOT_FOUND');
    if (!v.isOrganizer && rec.status === 'published') {
      await this.db.execute(sql`UPDATE events SET views_count = views_count + 1 WHERE id = ${rec.id}`);
    }
    return ok(await this.detail(rec, viewer));
  }

  async gallery(eventId: string): Promise<MediaRef[]> {
    const g = await rows<{ id: string; variants: MediaVariants }>(
      this.db,
      sql`SELECT m.id, m.variants FROM event_media em JOIN media_assets m ON m.id = em.asset_id WHERE em.event_id = ${eventId} ORDER BY em.position, m.created_at`,
    );
    return g.map((m) => ({ id: m.id, url: mediaUrl(m.variants['full']) ?? '', thumbUrl: mediaUrl(m.variants['thumb']) ?? '' }));
  }

  /** Edições anteriores da série (US-03.12): eventos encerrados + fotos. */
  async editions(eventId: string, viewer: Viewer | null): Promise<{ editions: EventCard[]; photos: MediaRef[] }> {
    const [ev] = await this.db.select({ seriesId: events.seriesId }).from(events).where(eq(events.id, eventId));
    if (!ev?.seriesId) return { editions: [], photos: [] };
    const now = this.clock.now();
    const o = await this.origin.forUser(viewer?.userId ?? null);
    const recs = await findEvents(
      this.db,
      { viewerId: viewer?.userId ?? null, origin: o.point },
      sql`e.series_id = ${ev.seriesId} AND e.id <> ${eventId} AND e.status = 'published' AND e.ends_at <= ${now}`,
      sql`ORDER BY e.starts_at DESC LIMIT 6`,
    );
    const photos: MediaRef[] = [];
    for (const r of recs) photos.push(...(await this.gallery(r.id)));
    return { editions: recs.map((r) => toEventCard(r, viewerFor(r, viewer), now)), photos: photos.slice(0, 12) };
  }

  async organizerPage(slug: string, viewer: Viewer | null): Promise<Result<OrganizerPublic>> {
    const [org] = await this.db.select().from(organizers).where(eq(organizers.slug, slug));
    if (!org) return err('NOT_FOUND');
    if (org.userId) {
      const [u] = await this.db.select({ status: users.status }).from(users).where(eq(users.id, org.userId));
      if (u && u.status !== 'active') return err('NOT_FOUND');
    }
    const now = this.clock.now();
    const o = await this.origin.forUser(viewer?.userId ?? null);
    const opts = { viewerId: viewer?.userId ?? null, origin: o.point };
    const visible = sql`e.organizer_id = ${org.id} AND e.status = 'published' AND (e.visibility = 'public' OR e.private_discoverable)`;
    const upcoming = await findEvents(this.db, opts, sql`${visible} AND e.ends_at > ${now}`, sql`ORDER BY e.starts_at LIMIT 20`);
    const past = await findEvents(this.db, opts, sql`${visible} AND e.ends_at <= ${now}`, sql`ORDER BY e.starts_at DESC LIMIT 20`);
    const sum = past.reduce((a, r) => a + r.ratingSum, 0) + upcoming.reduce((a, r) => a + r.ratingSum, 0);
    const count = past.reduce((a, r) => a + r.ratingCount, 0) + upcoming.reduce((a, r) => a + r.ratingCount, 0);
    return ok({
      ...(await this.orgs.toDto(org)),
      rating: count >= 3 ? ratingFrom(sum, count) : null,
      upcoming: upcoming.map((r) => toEventCard(r, viewerFor(r, viewer), now)),
      past: past.map((r) => ({ ...toEventCard(r, viewerFor(r, viewer), now), rating: ratingFrom(r.ratingSum, r.ratingCount) })),
    });
  }

  async organizerEvents(viewer: Viewer, tab: 'upcoming' | 'drafts' | 'past'): Promise<Result<OrganizerEventCard[]>> {
    const org = await this.orgs.byUser(viewer.userId);
    if (!org) return err('ORGANIZER_REQUIRED');
    const now = this.clock.now();
    const where =
      tab === 'drafts'
        ? sql`e.organizer_id = ${org.id} AND e.status = 'draft'`
        : tab === 'upcoming'
          ? sql`e.organizer_id = ${org.id} AND e.status IN ('published','cancelled') AND e.ends_at > ${now}`
          : sql`e.organizer_id = ${org.id} AND e.status IN ('published','cancelled') AND e.ends_at <= ${now}`;
    const order = tab === 'past' ? sql`ORDER BY e.starts_at DESC LIMIT 50` : tab === 'drafts' ? sql`ORDER BY e.updated_at DESC LIMIT 50` : sql`ORDER BY e.starts_at LIMIT 50`;
    const recs = await findEvents(this.db, { viewerId: viewer.userId, origin: null }, where, order);
    return ok(recs.map((r) => toOrganizerEventCard(r, now)));
  }

  // ---------- escrita (organizador) ----------

  /** @OrganizerOf: dono do evento ou admin. */
  async loadOwned(eventId: string, viewer: Viewer, db: DbOrTx = this.db): Promise<Result<Owned>> {
    const [r] = await db.select({ event: events, organizer: organizers }).from(events).innerJoin(organizers, eq(organizers.id, events.organizerId)).where(eq(events.id, eventId));
    if (!r) return err('NOT_FOUND');
    if (r.organizer.userId !== viewer.userId && viewer.role !== 'admin') return err('FORBIDDEN');
    return ok(r);
  }

  private async uniqueEventSlug(title: string, db: DbOrTx): Promise<string> {
    for (;;) {
      const slug = `${slugify(title).slice(0, 50)}-${randomSuffix(5)}`;
      const [hit] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
      if (!hit) return slug;
    }
  }

  private async uniqueAccessCode(db: DbOrTx): Promise<string> {
    for (;;) {
      const code = generateAccessCode(randomInt);
      const [hit] = await db.select({ id: events.id }).from(events).where(eq(events.accessCode, code));
      if (!hit) return code;
    }
  }

  private async typeExists(slug: string): Promise<boolean> {
    const r = await rows<{ slug: string }>(this.db, sql`SELECT slug FROM event_types WHERE slug = ${slug}`);
    return r.length > 0;
  }

  async createDraft(viewer: Viewer, input: EventDraftInput, organizerId?: string): Promise<Result<string>> {
    let orgId = organizerId;
    let orgKind: string | undefined;
    if (!orgId) {
      const org = await this.orgs.byUser(viewer.userId);
      if (!org) return err('ORGANIZER_REQUIRED');
      orgId = org.id;
      orgKind = org.kind;
    }
    if (!(await this.typeExists(input.typeSlug))) return err('VALIDATION_FAILED', 'Tipo de evento desconhecido');
    const id = newId();
    await this.db.transaction(async (tx) => {
      // pessoa física vem com evento privado por padrão (T-40)
      const visibility = input.visibility ?? (orgKind === 'person' ? 'private' : 'public');
      await tx.insert(events).values({
        id,
        organizerId: orgId,
        slug: await this.uniqueEventSlug(input.title, tx),
        title: input.title,
        typeSlug: input.typeSlug,
        description: input.description ?? '',
        ageRating: input.ageRating ?? 'free',
        timezone: 'America/Sao_Paulo',
        venueName: input.venueName ?? '',
        neighborhood: '',
        cityName: '',
        visibility,
        privateDiscoverable: input.privateDiscoverable ?? false,
        approvalMode: input.approvalMode ?? 'manual',
        accessCode: visibility === 'private' ? await this.uniqueAccessCode(tx) : null,
        capacity: input.capacity ?? null,
        priceItems: input.priceItems ?? [],
        externalTicketUrl: input.externalTicketUrl ?? null,
        status: 'draft',
        interestsCount: 0,
        goingCount: 0,
        pendingCount: 0,
        viewsCount: 0,
        ratingSum: 0,
        ratingCount: 0,
      });
    });
    return ok(id);
  }

  async patch(id: string, viewer: Viewer, input: EventPatchInput): Promise<Result<{ notifiesGoing: number }>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const e = owned.value.event;
    const now = this.clock.now();
    const editable = canEdit(e, now);
    if (!editable.ok) return editable;
    if (input.typeSlug && !(await this.typeExists(input.typeSlug))) return err('VALIDATION_FAILED', 'Tipo de evento desconhecido');

    const startsAt = input.startsAt !== undefined ? new Date(input.startsAt) : e.startsAt;
    const endsAt = input.endsAt !== undefined ? new Date(input.endsAt) : e.endsAt;
    const range = validateTimeRange({ startsAt, endsAt });
    if (!range.ok) return range;
    if (e.status === 'published' && input.startsAt !== undefined && startsAt && startsAt.getTime() !== e.startsAt?.getTime() && startsAt.getTime() <= now.getTime()) {
      return err('VALIDATION_FAILED', 'O início precisa estar no futuro.');
    }
    if (input.capacity !== undefined && input.capacity !== null && input.capacity < e.goingCount) {
      return err('VALIDATION_FAILED', `Já há ${e.goingCount} confirmados; a capacidade não pode ser menor.`);
    }

    const set: Partial<typeof events.$inferInsert> = { updatedAt: now };
    if (input.title !== undefined) set.title = input.title;
    if (input.typeSlug !== undefined) set.typeSlug = input.typeSlug;
    if (input.description !== undefined) set.description = input.description;
    if (input.ageRating !== undefined) set.ageRating = input.ageRating;
    if (input.startsAt !== undefined) set.startsAt = startsAt;
    if (input.endsAt !== undefined) set.endsAt = endsAt;
    if (input.venueName !== undefined) set.venueName = input.venueName;
    if (input.privateDiscoverable !== undefined) set.privateDiscoverable = input.privateDiscoverable;
    if (input.approvalMode !== undefined) set.approvalMode = input.approvalMode;
    if (input.capacity !== undefined) set.capacity = input.capacity;
    if (input.priceItems !== undefined) set.priceItems = input.priceItems;
    if (input.externalTicketUrl !== undefined) set.externalTicketUrl = input.externalTicketUrl;
    if (input.visibility !== undefined) {
      set.visibility = input.visibility;
      if (input.visibility === 'private' && !e.accessCode) set.accessCode = await this.uniqueAccessCode(this.db);
    }
    await this.db.update(events).set(set).where(eq(events.id, id));

    const changed = scheduleChanged({ startsAt: e.startsAt, endsAt: e.endsAt, lat: null, lng: null }, { startsAt, endsAt, lat: null, lng: null });
    return ok({ notifiesGoing: await this.notifyIfChanged(e, changed) });
  }

  private async notifyIfChanged(e: EventRow, changed: boolean): Promise<number> {
    if (!changed || e.status !== 'published' || e.goingCount === 0) return 0;
    await this.jobs.send('event.changed.notify', { eventId: e.id, at: this.clock.now().toISOString() });
    return e.goingCount;
  }

  async setCover(id: string, viewer: Viewer, file: Buffer | undefined): Promise<Result<void>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const editable = canEdit(owned.value.event, this.clock.now());
    if (!editable.ok) return editable;
    const up = await this.media.upload('cover', viewer.userId, file);
    if (!up.ok) return up;
    const prev = owned.value.event.coverAssetId;
    await this.db.update(events).set({ coverAssetId: up.value.id, updatedAt: this.clock.now() }).where(eq(events.id, id));
    if (prev) await this.media.removeAsset(prev);
    return ok(undefined);
  }

  /** CEP → ViaCEP → Nominatim, ou lat/lng → reverse (T-42B). */
  async geocode(id: string, viewer: Viewer, body: GeocodeBody): Promise<Result<VenuePreview & { notifiesGoing: number }>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const e = owned.value.event;
    const editable = canEdit(e, this.clock.now());
    if (!editable.ok) return editable;

    let preview: VenuePreview;
    if ('cep' in body) {
      const cep = body.cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
      const addr = await this.geo.cep(cep);
      if (!addr) return err('GEOCODE_FAILED');
      const point = await this.geo.geocode({ ...addr, number: body.number, cep });
      if (!point) return err('GEOCODE_FAILED');
      preview = {
        ...addr,
        number: body.number,
        complement: body.complement ?? null,
        cep,
        location: point,
        formatted: `${addr.street}, ${body.number}${body.complement ? ` — ${body.complement}` : ''} — ${addr.neighborhood}, ${addr.city}/${addr.uf}`,
      };
    } else {
      const rev = await this.geo.reverse({ lat: body.lat, lng: body.lng });
      preview = {
        street: rev?.street ?? '',
        number: '',
        complement: null,
        neighborhood: rev?.neighborhood ?? '',
        city: rev?.city ?? '',
        uf: rev?.uf ?? '',
        cep: rev?.cep ?? '',
        location: { lat: body.lat, lng: body.lng },
        formatted: rev ? `${rev.street} — ${rev.neighborhood}, ${rev.city}` : 'Localização atual',
      };
    }
    const [nearest] = await rows<{ id: string }>(
      this.db,
      sql`SELECT id FROM cities ORDER BY center <-> ST_SetSRID(ST_MakePoint(${preview.location.lng}, ${preview.location.lat}), 4326)::geography LIMIT 1`,
    );
    const before = await rows<{ lat: number | null; lng: number | null }>(this.db, sql`SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM events WHERE id = ${id}`);
    await this.db
      .update(events)
      .set({
        cep: preview.cep || null,
        street: preview.street || null,
        number: preview.number || null,
        complement: preview.complement,
        neighborhood: preview.neighborhood,
        cityName: preview.city,
        uf: preview.uf || null,
        cityId: nearest?.id ?? null,
        location: sql`ST_SetSRID(ST_MakePoint(${preview.location.lng}, ${preview.location.lat}), 4326)::geography`,
        ...('venueName' in body && body.venueName ? { venueName: body.venueName } : {}),
        updatedAt: this.clock.now(),
      })
      .where(eq(events.id, id));
    const b = before[0] ?? { lat: null, lng: null };
    const changed = b.lat !== null && scheduleChanged({ startsAt: null, endsAt: null, lat: b.lat, lng: b.lng }, { startsAt: null, endsAt: null, lat: preview.location.lat, lng: preview.location.lng });
    return ok({ ...preview, notifiesGoing: await this.notifyIfChanged(e, changed) });
  }

  async publishCheckFor(id: string, viewer: Viewer): Promise<Result<PublishCheck>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const e = owned.value.event;
    const missing = publishCheck(
      { title: e.title, typeSlug: e.typeSlug, hasCover: !!e.coverAssetId, startsAt: e.startsAt, endsAt: e.endsAt, venueName: e.venueName, hasLocation: e.location !== null },
      this.clock.now(),
    );
    return ok({ ok: missing.length === 0, missing });
  }

  async publish(id: string, viewer: Viewer): Promise<Result<void>> {
    const check = await this.publishCheckFor(id, viewer);
    if (!check.ok) return check;
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const e = owned.value.event;
    if (e.status === 'published') return ok(undefined);
    if (e.status !== 'draft') return err('EVENT_UNAVAILABLE');
    if (viewer.role !== 'admin') {
      const [u] = await this.db.select({ v: users.emailVerifiedAt }).from(users).where(eq(users.id, viewer.userId));
      if (!u?.v) return err('EMAIL_NOT_VERIFIED');
    }
    if (!check.value.ok) return err('EVENT_NOT_PUBLISHABLE', undefined, check.value.missing);
    const now = this.clock.now();
    await this.db.update(events).set({ status: 'published', publishedAt: now, updatedAt: now }).where(and(eq(events.id, id), eq(events.status, 'draft')));
    await audit(this.db, { actorId: viewer.userId, action: 'event.published', entity: 'event', entityId: id });
    return ok(undefined);
  }

  /** RF-E03-06 / RN-09: os RSVPs viram cancelled_by_event e os confirmados recebem e-mail. */
  async cancel(id: string, viewer: Viewer, reason: string): Promise<Result<void>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const e = owned.value.event;
    const now = this.clock.now();
    if (e.status !== 'published') return err('EVENT_UNAVAILABLE');
    if (e.endsAt && phaseOf(e.startsAt ?? now, e.endsAt, now) === 'ended') return err('EVENT_NOT_EDITABLE');
    await this.db.transaction(async (tx) => {
      await tx.update(events).set({ status: 'cancelled', cancelReason: reason, updatedAt: now }).where(eq(events.id, id));
      await tx
        .update(rsvps)
        .set({ status: 'cancelled_by_event', updatedAt: now })
        .where(and(eq(rsvps.eventId, id), sql`${rsvps.status} IN ('confirmed','approved','pending')`));
      await audit(tx, { actorId: viewer.userId, action: 'event.cancelled', entity: 'event', entityId: id, payload: { reason } });
    });
    await this.jobs.send('event.cancelled.notify', { eventId: id }, { singletonKey: `cancel:${id}` });
    return ok(undefined);
  }

  async deleteDraft(id: string, viewer: Viewer): Promise<Result<void>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    if (owned.value.event.status !== 'draft') return err('EVENT_NOT_EDITABLE', 'Só rascunhos podem ser excluídos.');
    await this.db.delete(events).where(eq(events.id, id));
    if (owned.value.event.coverAssetId) await this.media.removeAsset(owned.value.event.coverAssetId);
    return ok(undefined);
  }

  /** RF-E02-10: nova edição na mesma série (copia os dados, sem datas). */
  async newEdition(id: string, viewer: Viewer): Promise<Result<string>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const src = owned.value.event;
    const newIdValue = newId();
    await this.db.transaction(async (tx) => {
      let seriesId = src.seriesId;
      if (!seriesId) {
        seriesId = newId();
        await tx.insert(eventSeries).values({ id: seriesId, organizerId: src.organizerId, name: src.title });
        await tx.update(events).set({ seriesId }).where(eq(events.id, src.id));
      }
      await tx.execute(sql`
        INSERT INTO events (id, organizer_id, series_id, slug, title, type_slug, description, cover_asset_id, age_rating, timezone,
          venue_name, cep, street, number, complement, neighborhood, city_id, city_name, uf, location, visibility, private_discoverable,
          approval_mode, access_code, capacity, price_items, external_ticket_url, status)
        SELECT ${newIdValue}, organizer_id, ${seriesId}, ${await this.uniqueEventSlug(src.title, tx)}, title, type_slug, description, NULL, age_rating, timezone,
          venue_name, cep, street, number, complement, neighborhood, city_id, city_name, uf, location, visibility, private_discoverable,
          approval_mode, ${src.visibility === 'private' ? await this.uniqueAccessCode(tx) : null}, capacity, price_items, external_ticket_url, 'draft'
        FROM events WHERE id = ${src.id}`);
    });
    return ok(newIdValue);
  }

  async addGallery(id: string, viewer: Viewer, files: Buffer[]): Promise<Result<MediaRef[]>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const [{ n } = { n: 0 }] = await rows<{ n: number }>(this.db, sql`SELECT count(*)::int AS n FROM event_media WHERE event_id = ${id}`);
    if (n + files.length > MAX_GALLERY) return err('VALIDATION_FAILED', `Até ${MAX_GALLERY} fotos por evento.`);
    let pos = n;
    for (const f of files) {
      const up = await this.media.upload('gallery', viewer.userId, f);
      if (!up.ok) return up;
      await this.db.insert(eventMedia).values({ eventId: id, assetId: up.value.id, position: pos++ });
    }
    return ok(await this.gallery(id));
  }

  async removeGallery(id: string, viewer: Viewer, assetId: string): Promise<Result<void>> {
    const owned = await this.loadOwned(id, viewer);
    if (!owned.ok) return owned;
    const del = await this.db.delete(eventMedia).where(and(eq(eventMedia.eventId, id), eq(eventMedia.assetId, assetId))).returning();
    if (!del.length) return err('NOT_FOUND');
    await this.media.removeAsset(assetId);
    return ok(undefined);
  }

  /** Detalhe para o dono após escrita. */
  async ownerDetail(id: string, viewer: Viewer): Promise<EventDetail> {
    const rec = await this.record(sql`e.id = ${id}`, viewer);
    if (!rec) throw new Error('event vanished');
    return this.detail(rec, viewer);
  }

  async isGoingUser(eventId: string, userId: string): Promise<boolean> {
    const [r] = await this.db.select({ s: rsvps.status }).from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, userId)));
    return isGoing(r?.s ?? null);
  }

}
