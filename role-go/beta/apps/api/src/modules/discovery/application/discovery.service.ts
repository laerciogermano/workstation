import { Inject, Injectable } from '@nestjs/common';
import { DiscoveryFilters, type DiscoveryQuery, type EventCard, type Origin, PAGE_LIMIT, type Page } from '@rolego/contracts';
import { sql, type SQL } from 'drizzle-orm';
import type { Viewer } from '../../../shared/auth/viewer';
import { DB, rows, textArray, type Db } from '../../../shared/db/db';
import { Clock } from '../../../shared/kernel/clock';
import { discoverableWhere, findEvents, originPoint, OriginResolver, toEventCard, viewerFor } from '../../events';
import { decodeCursor, dayIntervals, encodeCursor } from '../domain/day-ranges';

type Resolved = { origin: Origin & { preferredTypes: string[] }; where: SQL };

/** Consultas da descoberta (docs/05 §4). SQL explícito e parametrizado. */
@Injectable()
export class DiscoveryService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
    private readonly origins: OriginResolver,
  ) {}

  private async resolve(viewer: Viewer | null, q: Partial<DiscoveryQuery>): Promise<Resolved> {
    const now = this.clock.now();
    let origin = await this.origins.forUser(viewer?.userId ?? null, q.radiusKm);
    if (q.cityId) {
      const c = await this.origins.city(q.cityId);
      if (c) {
        origin = {
          mode: 'override',
          label: c.name,
          city: { id: c.id, name: c.name, uf: c.uf, launchStatus: c.launchStatus },
          point: { lat: c.lat, lng: c.lng },
          radiusKm: q.radiusKm ?? origin.radiusKm,
          preferredTypes: origin.preferredTypes,
        };
      }
    } else if (q.lat !== undefined && q.lng !== undefined) {
      origin = { ...origin, mode: 'gps', point: { lat: q.lat, lng: q.lng }, radiusKm: q.radiusKm ?? origin.radiusKm };
    }
    const [p] = viewer
      ? await rows<{ filters: unknown }>(this.db, sql`SELECT filters FROM discovery_preferences WHERE user_id = ${viewer.userId}`)
      : [];
    const saved = DiscoveryFilters.parse(viewer ? (p?.filters ?? {}) : {});
    const types = q.types ?? saved.types;
    const days = q.days ?? saved.days;
    const freeOnly = q.freeOnly ?? saved.freeOnly;
    const range = q.from || q.to ? { from: q.from ?? null, to: q.to ?? null } : saved.range;

    const parts: SQL[] = [
      discoverableWhere(now),
      sql`ST_DWithin(e.location, ${originPoint(origin.point)}, ${origin.radiusKm * 1000})`,
    ];
    if (types.length) parts.push(sql`e.type_slug = ANY(${textArray(types)})`);
    const intervals = dayIntervals(days, now, 'America/Sao_Paulo');
    if (range?.from || range?.to) intervals.push({ from: range.from ? new Date(range.from) : now, to: range.to ? new Date(range.to) : new Date(now.getTime() + 365 * 86400_000) });
    if (intervals.length) {
      parts.push(sql`(${sql.join(intervals.map((i) => sql`(e.ends_at > ${i.from} AND e.starts_at < ${i.to})`), sql` OR `)})`);
    }
    if (freeOnly) parts.push(sql`NOT EXISTS (SELECT 1 FROM jsonb_array_elements(e.price_items) x WHERE coalesce((x->>'priceCents')::int, 0) > 0)`);
    return { origin, where: sql.join(parts, sql` AND `) };
  }

  private cards(recs: Awaited<ReturnType<typeof findEvents>>, viewer: Viewer | null): EventCard[] {
    const now = this.clock.now();
    return recs.map((r) => toEventCard(r, viewerFor(r, viewer), now));
  }

  private vid(viewer: Viewer | null): string | null {
    return viewer?.userId ?? null;
  }

  /** Feed: ordena por início, cursor (starts_at, id). */
  async feed(viewer: Viewer | null, q: DiscoveryQuery): Promise<Page<EventCard> & { origin: Origin }> {
    const { origin, where } = await this.resolve(viewer, q);
    const c = decodeCursor(q.cursor);
    const after = c?.k === 't' ? sql` AND (e.starts_at, e.id) > (${new Date(c.s)}, ${c.id})` : sql``;
    const recs = await findEvents(this.db, { viewerId: this.vid(viewer), origin: origin.point }, sql`${where}${after}`, sql`ORDER BY e.starts_at, e.id LIMIT ${PAGE_LIMIT + 1}`);
    const page = recs.slice(0, PAGE_LIMIT);
    const last = page[page.length - 1];
    return {
      items: this.cards(page, viewer),
      nextCursor: recs.length > PAGE_LIMIT && last?.startsAt ? encodeCursor({ k: 't', s: last.startsAt.toISOString(), id: last.id }) : null,
      origin: strip(origin),
    };
  }

  /** Swipe: exclui já curtidos e passados (só logado); tipos preferidos primeiro (RF-E02-27). */
  async swipe(viewer: Viewer | null, q: DiscoveryQuery): Promise<EventCard[]> {
    const { origin, where } = await this.resolve(viewer, q);
    const uid = this.vid(viewer);
    const exclude =
      uid
        ? sql` AND i.user_id IS NULL AND NOT EXISTS (SELECT 1 FROM swipe_passes p WHERE p.event_id = e.id AND p.user_id = ${uid})`
        : sql``;
    const recs = await findEvents(
      this.db,
      { viewerId: uid, origin: origin.point },
      sql`${where}${exclude}`,
      sql`ORDER BY (e.type_slug = ANY(${textArray(origin.preferredTypes)}))::int DESC, e.starts_at, ST_Distance(e.location, ${originPoint(origin.point)}) LIMIT 10`,
    );
    return this.cards(recs, viewer);
  }

  async list(viewer: Viewer | null, q: DiscoveryQuery): Promise<Page<EventCard> & { origin: Origin }> {
    if (q.sort === 'soonest') return this.feed(viewer, q);
    const { origin, where } = await this.resolve(viewer, q);
    const c = decodeCursor(q.cursor);
    const offset = c?.k === 'o' ? c.o : 0;
    const recs = await findEvents(
      this.db,
      { viewerId: this.vid(viewer), origin: origin.point },
      where,
      sql`ORDER BY ST_Distance(e.location, ${originPoint(origin.point)}), e.starts_at, e.id LIMIT ${PAGE_LIMIT + 1} OFFSET ${offset}`,
    );
    return {
      items: this.cards(recs.slice(0, PAGE_LIMIT), viewer),
      nextCursor: recs.length > PAGE_LIMIT ? encodeCursor({ k: 'o', o: offset + PAGE_LIMIT }) : null,
      origin: strip(origin),
    };
  }

  async count(viewer: Viewer | null, q: Partial<DiscoveryQuery>): Promise<{ total: number }> {
    const { where } = await this.resolve(viewer, q);
    const [r] = await rows<{ total: number }>(
      this.db,
      sql`SELECT count(*)::int AS total FROM events e JOIN organizers o ON o.id = e.organizer_id LEFT JOIN users ou ON ou.id = o.user_id WHERE ${where}`,
    );
    return { total: r?.total ?? 0 };
  }

  /** Busca por título ou local sem acento (unaccent + trigram), só eventos futuros. */
  async search(viewer: Viewer | null, q: { q: string; scope: 'radius' | 'city'; cursor?: string }): Promise<Page<EventCard>> {
    const now = this.clock.now();
    const origin = await this.origins.forUser(this.vid(viewer));
    const like = `%${q.q.replace(/[%_\\]/g, '')}%`;
    const scope =
      q.scope === 'city' && origin.city
        ? sql`e.city_id = ${origin.city.id}`
        : sql`ST_DWithin(e.location, ${originPoint(origin.point)}, ${origin.radiusKm * 1000})`;
    const c = decodeCursor(q.cursor);
    const offset = c?.k === 'o' ? c.o : 0;
    const recs = await findEvents(
      this.db,
      { viewerId: this.vid(viewer), origin: origin.point },
      sql`${discoverableWhere(now)} AND ${scope} AND (
            immutable_unaccent(lower(e.title)) LIKE immutable_unaccent(lower(${like}))
            OR immutable_unaccent(lower(e.venue_name)) LIKE immutable_unaccent(lower(${like}))
            OR e.search @@ plainto_tsquery('portuguese', immutable_unaccent(${q.q})))`,
      sql`ORDER BY e.starts_at, e.id LIMIT ${PAGE_LIMIT + 1} OFFSET ${offset}`,
    );
    return { items: this.cards(recs.slice(0, PAGE_LIMIT), viewer), nextCursor: recs.length > PAGE_LIMIT ? encodeCursor({ k: 'o', o: offset + PAGE_LIMIT }) : null };
  }
}

const strip = (o: Origin & { preferredTypes: string[] }): Origin => ({ mode: o.mode, label: o.label, city: o.city, point: o.point, radiusKm: o.radiusKm });
