import { Inject, Injectable } from '@nestjs/common';
import { type Counts, type EventCard, type Guest, GOING_STATUSES, type Page, type PersonRef, type RsvpResult, type RsvpStatus } from '@rolego/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { Viewer } from '../../../shared/auth/viewer';
import { DB, rows, textArray, type Db, type DbOrTx } from '../../../shared/db/db';
import { events, interests, rsvps, swipePasses, users } from '../../../shared/db/schema';
import { env } from '../../../shared/env';
import { JobQueue } from '../../../shared/jobs/job-queue';
import { Clock } from '../../../shared/kernel/clock';
import { newId } from '../../../shared/kernel/ids';
import { err, ok, type Result } from '../../../shared/kernel/result';
import { mediaUrl } from '../../../shared/media/storage';
import { EventsService, findEvents, OriginResolver, toEventCard, viewerFor } from '../../events';
import { canCancelRsvp, canCheckIn, decideRsvp } from '../domain/rsvp.policy';
import { buildIcs } from '../domain/ics';

const PEOPLE_PAGE = 30;

@Injectable()
export class EngagementService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
    private readonly jobs: JobQueue,
    private readonly eventsSvc: EventsService,
    private readonly origins: OriginResolver,
  ) {}

  private async counts(eventId: string, db: DbOrTx = this.db): Promise<Counts> {
    const [c] = await db.select({ interested: events.interestsCount, going: events.goingCount }).from(events).where(eq(events.id, eventId));
    return c ?? { interested: 0, going: 0 };
  }

  private async visibleEvent(eventId: string) {
    const [e] = await this.db.select().from(events).where(eq(events.id, eventId));
    if (!e || e.status === 'draft' || e.status === 'removed') return null;
    return e;
  }

  // ---------- interesse e passe (idempotentes) ----------

  async setInterest(viewer: Viewer, eventId: string, on: boolean): Promise<Result<{ interested: boolean; counts: Counts }>> {
    if (!(await this.visibleEvent(eventId))) return err('NOT_FOUND');
    const counts = await this.db.transaction(async (tx) => {
      if (on) {
        const ins = await tx.insert(interests).values({ userId: viewer.userId, eventId }).onConflictDoNothing().returning();
        if (ins.length) await tx.execute(sql`UPDATE events SET interests_count = interests_count + 1 WHERE id = ${eventId}`);
      } else {
        const del = await tx.delete(interests).where(and(eq(interests.userId, viewer.userId), eq(interests.eventId, eventId))).returning();
        if (del.length) await tx.execute(sql`UPDATE events SET interests_count = greatest(0, interests_count - 1) WHERE id = ${eventId}`);
      }
      return this.counts(eventId, tx);
    });
    return ok({ interested: on, counts });
  }

  /** RN-06: passar esconde só no swipe daquele usuário. */
  async setPass(viewer: Viewer, eventId: string, on: boolean): Promise<Result<void>> {
    if (!(await this.visibleEvent(eventId))) return err('NOT_FOUND');
    if (on) await this.db.insert(swipePasses).values({ userId: viewer.userId, eventId }).onConflictDoNothing();
    else await this.db.delete(swipePasses).where(and(eq(swipePasses.userId, viewer.userId), eq(swipePasses.eventId, eventId)));
    return ok(undefined);
  }

  // ---------- RSVP ----------

  /** Reserva a vaga com UPDATE condicional atômico; 0 linhas = lotado (docs/05 §4.3). */
  private async reserveSeat(tx: DbOrTx, eventId: string, now: Date): Promise<boolean> {
    const r = await tx.execute(sql`
      UPDATE events SET going_count = going_count + 1
       WHERE id = ${eventId} AND status = 'published' AND ends_at > ${now}
         AND (capacity IS NULL OR going_count < capacity)
      RETURNING id`);
    return r.rows.length === 1;
  }

  private async lockPair(tx: DbOrTx, eventId: string, userId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${eventId + ':' + userId}, 0))`);
  }

  async rsvp(viewer: Viewer, eventId: string, accessCode: string | null): Promise<Result<RsvpResult>> {
    const now = this.clock.now();
    const e = await this.visibleEvent(eventId);
    if (!e) return err('NOT_FOUND');
    const [u] = await this.db.select({ adult: users.adultDeclaredAt }).from(users).where(eq(users.id, viewer.userId));
    const owned = await this.eventsSvc.loadOwned(eventId, viewer);

    const result = await this.db.transaction(async (tx): Promise<Result<RsvpStatus>> => {
      await this.lockPair(tx, eventId, viewer.userId);
      const [cur] = await tx.select().from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, viewer.userId)));
      const d = decideRsvp(e, { adult: !!u?.adult, current: cur?.status ?? null, isOrganizer: owned.ok }, accessCode, now);
      if (!d.ok) return d;
      if (d.value.kind === 'noop') return ok(d.value.status);
      const status = d.value.status;
      if (status === 'pending') {
        await tx.execute(sql`UPDATE events SET pending_count = pending_count + 1 WHERE id = ${eventId}`);
      } else if (!(await this.reserveSeat(tx, eventId, now))) {
        return err('EVENT_FULL');
      }
      await tx
        .insert(rsvps)
        .values({ id: newId(), eventId, userId: viewer.userId, status, decidedAt: status === 'pending' ? null : now })
        .onConflictDoUpdate({
          target: [rsvps.eventId, rsvps.userId],
          set: { status, updatedAt: now, decidedAt: status === 'pending' ? null : now, decidedBy: null },
        });
      // RN-04: confirmar presença marca interesse
      const ins = await tx.insert(interests).values({ userId: viewer.userId, eventId }).onConflictDoNothing().returning();
      if (ins.length) await tx.execute(sql`UPDATE events SET interests_count = interests_count + 1 WHERE id = ${eventId}`);
      return ok(status);
    });
    if (!result.ok) return result;
    if (result.value === 'confirmed' || result.value === 'approved') {
      await this.jobs.send('email.send', { template: 'rsvp_confirmed', userId: viewer.userId, eventId }, { singletonKey: `rsvp:${eventId}:${viewer.userId}` });
    }
    return ok({ status: result.value, counts: await this.counts(eventId) });
  }

  async cancelRsvp(viewer: Viewer, eventId: string): Promise<Result<RsvpResult>> {
    const now = this.clock.now();
    const [e] = await this.db.select({ endsAt: events.endsAt }).from(events).where(eq(events.id, eventId));
    if (!e) return err('NOT_FOUND');
    const r = await this.db.transaction(async (tx): Promise<Result<void>> => {
      await this.lockPair(tx, eventId, viewer.userId);
      const [cur] = await tx.select().from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, viewer.userId)));
      const allowed = canCancelRsvp(cur?.status ?? null, e.endsAt, now);
      if (!allowed.ok || !cur) return allowed;
      if (cur.status === 'pending') await tx.execute(sql`UPDATE events SET pending_count = greatest(0, pending_count - 1) WHERE id = ${eventId}`);
      else await tx.execute(sql`UPDATE events SET going_count = greatest(0, going_count - 1) WHERE id = ${eventId}`);
      await tx.update(rsvps).set({ status: 'cancelled_by_user', updatedAt: now }).where(eq(rsvps.id, cur.id));
      return ok(undefined);
    });
    if (!r.ok) return r;
    return ok({ status: 'cancelled_by_user', counts: await this.counts(eventId) });
  }

  async here(viewer: Viewer, eventId: string): Promise<Result<void>> {
    const [r] = await this.db
      .select({ id: rsvps.id, status: rsvps.status, startsAt: events.startsAt, endsAt: events.endsAt })
      .from(rsvps)
      .innerJoin(events, eq(events.id, rsvps.eventId))
      .where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, viewer.userId)));
    if (!r || !canCheckIn(r.status, r.startsAt, r.endsAt, this.clock.now())) return err('FORBIDDEN');
    await this.db.update(rsvps).set({ hereAt: this.clock.now() }).where(eq(rsvps.id, r.id));
    return ok(undefined);
  }

  /** Código do evento privado → slug (rate limit no controller). */
  async byAccessCode(code: string): Promise<Result<{ slug: string }>> {
    const [e] = await this.db.select({ slug: events.slug, status: events.status }).from(events).where(eq(events.accessCode, code.toUpperCase()));
    if (!e || e.status === 'draft' || e.status === 'removed') return err('ACCESS_CODE_INVALID');
    return ok({ slug: e.slug });
  }

  // ---------- Quem vai (só quem deixou a presença visível) ----------

  async people(viewer: Viewer | null, eventId: string, kind: 'going' | 'interested', cursor: string | undefined): Promise<Result<Page<PersonRef> & { hiddenCount: number; total: number }>> {
    const e = await this.visibleEvent(eventId);
    if (!e) return err('NOT_FOUND');
    if (e.visibility === 'private') {
      const owned = viewer ? await this.eventsSvc.loadOwned(eventId, viewer) : null;
      const going = viewer ? await this.eventsSvc.isGoingUser(eventId, viewer.userId) : false;
      if (!owned?.ok && !going && !e.privateDiscoverable) return err('FORBIDDEN');
    }
    const offset = Math.max(0, Number.parseInt(cursor ?? '0', 10) || 0);
    const from =
      kind === 'going'
        ? sql`FROM rsvps x JOIN users u ON u.id = x.user_id LEFT JOIN media_assets m ON m.id = u.photo_asset_id
              WHERE x.event_id = ${eventId} AND x.status IN ('confirmed','approved') AND u.status = 'active'`
        : sql`FROM interests x JOIN users u ON u.id = x.user_id LEFT JOIN media_assets m ON m.id = u.photo_asset_id
              WHERE x.event_id = ${eventId} AND u.status = 'active'`;
    const list = await rows<{ id: string; name: string; photo: Record<string, string> | null }>(
      this.db,
      sql`SELECT u.id, u.name, m.variants AS photo ${from} AND u.show_presence ORDER BY x.created_at DESC LIMIT ${PEOPLE_PAGE + 1} OFFSET ${offset}`,
    );
    const [t] = await rows<{ total: number; visible: number }>(this.db, sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE u.show_presence)::int AS visible ${from}`);
    return ok({
      items: list.slice(0, PEOPLE_PAGE).map((p) => ({ id: p.id, name: p.name, photoUrl: mediaUrl(p.photo?.['md']) })),
      nextCursor: list.length > PEOPLE_PAGE ? String(offset + PEOPLE_PAGE) : null,
      hiddenCount: (t?.total ?? 0) - (t?.visible ?? 0),
      total: t?.total ?? 0,
    });
  }

  // ---------- Lista de convidados (organizador) ----------

  async guests(viewer: Viewer, eventId: string, status: 'pending' | 'going'): Promise<Result<Page<Guest>>> {
    const owned = await this.eventsSvc.loadOwned(eventId, viewer);
    if (!owned.ok) return owned;
    const now = this.clock.now();
    const statuses = status === 'pending' ? ['pending'] : [...GOING_STATUSES];
    const list = await rows<{ userId: string; name: string; photo: Record<string, string> | null; city: string | null; attendedCount: number; status: RsvpStatus; requestedAt: Date }>(
      this.db,
      sql`SELECT u.id AS "userId", u.name, m.variants AS photo, c.name AS city, r.status, r.created_at AS "requestedAt",
            (SELECT count(*) FROM rsvps r2 JOIN events e2 ON e2.id = r2.event_id
              WHERE r2.user_id = u.id AND r2.status IN ('confirmed','approved') AND e2.ends_at <= ${now})::int AS "attendedCount"
          FROM rsvps r JOIN users u ON u.id = r.user_id
          LEFT JOIN media_assets m ON m.id = u.photo_asset_id
          LEFT JOIN discovery_preferences p ON p.user_id = u.id
          LEFT JOIN cities c ON c.id = p.city_id
          WHERE r.event_id = ${eventId} AND r.status = ANY(${textArray(statuses)})
          ORDER BY r.created_at LIMIT 500`,
    );
    return ok({
      items: list.map((g) => ({ userId: g.userId, name: g.name, photoUrl: mediaUrl(g.photo?.['md']), city: g.city, attendedCount: g.attendedCount, status: g.status, requestedAt: g.requestedAt.toISOString() })),
      nextCursor: null,
    });
  }

  private async decide(tx: DbOrTx, eventId: string, userId: string, approve: boolean, by: string, now: Date): Promise<Result<RsvpStatus>> {
    await this.lockPair(tx, eventId, userId);
    const [cur] = await tx.select().from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, userId)));
    if (!cur) return err('NOT_FOUND');
    if (approve) {
      if (cur.status === 'approved' || cur.status === 'confirmed') return ok(cur.status);
      if (cur.status !== 'pending') return err('NOT_FOUND');
      if (!(await this.reserveSeat(tx, eventId, now))) return err('EVENT_FULL');
      await tx.execute(sql`UPDATE events SET pending_count = greatest(0, pending_count - 1) WHERE id = ${eventId}`);
      await tx.update(rsvps).set({ status: 'approved', decidedAt: now, decidedBy: by, updatedAt: now }).where(eq(rsvps.id, cur.id));
      return ok('approved');
    }
    if (cur.status === 'declined') return ok('declined');
    if (cur.status === 'pending') await tx.execute(sql`UPDATE events SET pending_count = greatest(0, pending_count - 1) WHERE id = ${eventId}`);
    else if (cur.status === 'approved' || cur.status === 'confirmed') await tx.execute(sql`UPDATE events SET going_count = greatest(0, going_count - 1) WHERE id = ${eventId}`);
    else return err('NOT_FOUND');
    await tx.update(rsvps).set({ status: 'declined', decidedAt: now, decidedBy: by, updatedAt: now }).where(eq(rsvps.id, cur.id));
    return ok('declined');
  }

  async decideGuest(viewer: Viewer, eventId: string, userId: string, approve: boolean): Promise<Result<Guest>> {
    const owned = await this.eventsSvc.loadOwned(eventId, viewer);
    if (!owned.ok) return owned;
    const now = this.clock.now();
    const r = await this.db.transaction((tx) => this.decide(tx, eventId, userId, approve, viewer.userId, now));
    if (!r.ok) return r;
    await this.jobs.send('email.send', { template: approve ? 'rsvp_approved' : 'rsvp_declined', userId, eventId }, { singletonKey: `decide:${eventId}:${userId}:${r.value}` });
    const g = await this.guests(viewer, eventId, approve ? 'going' : 'pending');
    const found = g.ok ? g.value.items.find((x) => x.userId === userId) : undefined;
    const [u] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, userId));
    return ok(found ?? { userId, name: u?.name ?? '', photoUrl: null, city: null, attendedCount: 0, status: r.value, requestedAt: now.toISOString() });
  }

  /** "Aprovar todos" respeita a capacidade; o excedente fica pendente. */
  async approveAll(viewer: Viewer, eventId: string): Promise<Result<{ approved: number; leftPending: number }>> {
    const owned = await this.eventsSvc.loadOwned(eventId, viewer);
    if (!owned.ok) return owned;
    const now = this.clock.now();
    const pending = await this.db.select({ userId: rsvps.userId }).from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.status, 'pending'))).orderBy(rsvps.createdAt);
    let approved = 0;
    for (const p of pending) {
      const r = await this.db.transaction((tx) => this.decide(tx, eventId, p.userId, true, viewer.userId, now));
      if (!r.ok) break;
      approved++;
      await this.jobs.send('email.send', { template: 'rsvp_approved', userId: p.userId, eventId }, { singletonKey: `decide:${eventId}:${p.userId}:approved` });
    }
    return ok({ approved, leftPending: pending.length - approved });
  }

  // ---------- Meus rolês ----------

  async myRsvps(viewer: Viewer, scope: 'upcoming' | 'past'): Promise<Page<EventCard & { rsvpStatus: RsvpStatus }>> {
    const now = this.clock.now();
    const origin = await this.origins.forUser(viewer.userId);
    const where =
      scope === 'upcoming'
        ? sql`r.status IN ('confirmed','approved','pending','cancelled_by_event') AND e.ends_at > ${now} AND e.status IN ('published','cancelled')`
        : sql`r.status IN ('confirmed','approved') AND e.ends_at <= ${now} AND e.status = 'published'`;
    const recs = await findEvents(this.db, { viewerId: viewer.userId, origin: origin.point }, where, scope === 'upcoming' ? sql`ORDER BY e.starts_at LIMIT 100` : sql`ORDER BY e.starts_at DESC LIMIT 100`);
    return {
      items: recs.map((r) => ({ ...toEventCard(r, viewerFor(r, viewer), now), rsvpStatus: r.viewerRsvp ?? 'confirmed' })),
      nextCursor: null,
    };
  }

  /** .ics montado a partir do EventDetail: o endereço só entra se o presenter liberou. */
  async ics(eventId: string, viewer: Viewer | null): Promise<Result<string>> {
    const rec = await this.eventsSvc.record(sql`e.id = ${eventId}`, viewer);
    if (!rec || !rec.startsAt || !rec.endsAt || rec.status === 'draft' || rec.status === 'removed') return err('NOT_FOUND');
    const d = await this.eventsSvc.detail(rec, viewer);
    const loc = d.venue.addressLocked
      ? `${d.venue.name} — ${d.venue.neighborhood}, ${d.venue.city}`
      : `${d.venue.name}, ${[d.venue.street, d.venue.number].filter(Boolean).join(', ')} — ${d.venue.neighborhood}, ${d.venue.city}`;
    return ok(buildIcs({ id: d.id, title: d.title, startsAt: rec.startsAt, endsAt: rec.endsAt, location: loc, url: `${env().APP_URL}/e/${d.slug}`, description: d.description }, this.clock.now()));
  }
}
