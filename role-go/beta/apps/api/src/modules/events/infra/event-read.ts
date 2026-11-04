import { sql, type SQL } from 'drizzle-orm';
import type { PriceItem, RsvpStatus } from '@rolego/contracts';
import { rows, type DbOrTx } from '../../../shared/db/db';
import type { MediaVariants } from '../../../shared/db/schema';
import { NIL_UUID } from '../../../shared/kernel/ids';

/** Linha "crua" de evento. Só o EventPresenter transforma isso em DTO. */
export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  typeSlug: string;
  typeLabel: string;
  typeAccent: 'cyan' | 'magenta' | 'yellow' | 'green' | 'violet';
  description: string;
  ageRating: 'free' | '16' | '18';
  startsAt: Date | null;
  endsAt: Date | null;
  timezone: string;
  venueName: string;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string;
  cityName: string;
  cityId: string | null;
  lat: number | null;
  lng: number | null;
  visibility: 'public' | 'private';
  privateDiscoverable: boolean;
  approvalMode: 'manual' | 'auto';
  accessCode: string | null;
  capacity: number | null;
  priceItems: PriceItem[];
  externalTicketUrl: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'removed';
  cancelReason: string | null;
  interestsCount: number;
  goingCount: number;
  pendingCount: number;
  viewsCount: number;
  ratingSum: number;
  ratingCount: number;
  seriesId: string | null;
  organizerId: string;
  coverAssetId: string | null;
  orgSlug: string;
  orgName: string;
  orgKind: 'person' | 'bar' | 'venue' | 'producer';
  orgUserId: string | null;
  orgAvatar: MediaVariants | null;
  coverVariants: MediaVariants | null;
  distanceKm: number | null;
  viewerInterested: boolean;
  viewerRsvp: RsvpStatus | null;
  viewerHereAt: Date | null;
  peopleGoing: { id: string; name: string; photo: MediaVariants | null }[];
};

export type ReadOpts = { viewerId: string | null; origin: { lat: number; lng: number } | null };

export const originPoint = (o: { lat: number; lng: number }): SQL =>
  sql`ST_SetSRID(ST_MakePoint(${o.lng}, ${o.lat}), 4326)::geography`;

/** SELECT base de evento com joins de tipo, organizador, capa, viewer e prova social. */
export function eventSelect(opts: ReadOpts): SQL {
  const viewer = opts.viewerId ?? NIL_UUID;
  const distance = opts.origin ? sql`ST_Distance(e.location, ${originPoint(opts.origin)}) / 1000.0` : sql`NULL::float8`;
  return sql`
    SELECT e.id, e.slug, e.title, e.type_slug AS "typeSlug", t.label AS "typeLabel", t.accent AS "typeAccent",
      e.description, e.age_rating AS "ageRating", e.starts_at AS "startsAt", e.ends_at AS "endsAt", e.timezone,
      e.venue_name AS "venueName", e.cep, e.street, e.number, e.complement, e.neighborhood, e.city_name AS "cityName", e.city_id AS "cityId",
      ST_Y(e.location::geometry) AS lat, ST_X(e.location::geometry) AS lng,
      e.visibility, e.private_discoverable AS "privateDiscoverable", e.approval_mode AS "approvalMode", e.access_code AS "accessCode",
      e.capacity, e.price_items AS "priceItems", e.external_ticket_url AS "externalTicketUrl", e.status, e.cancel_reason AS "cancelReason",
      e.interests_count AS "interestsCount", e.going_count AS "goingCount", e.pending_count AS "pendingCount", e.views_count AS "viewsCount",
      e.rating_sum AS "ratingSum", e.rating_count AS "ratingCount", e.series_id AS "seriesId", e.organizer_id AS "organizerId",
      e.cover_asset_id AS "coverAssetId",
      o.slug AS "orgSlug", o.display_name AS "orgName", o.kind AS "orgKind", o.user_id AS "orgUserId", oa.variants AS "orgAvatar",
      ca.variants AS "coverVariants",
      ${distance} AS "distanceKm",
      (i.user_id IS NOT NULL) AS "viewerInterested", r.status AS "viewerRsvp", r.here_at AS "viewerHereAt",
      (SELECT coalesce(json_agg(json_build_object('id', pg.id, 'name', pg.name, 'photo', pg.variants)), '[]'::json)
         FROM (SELECT u.id, u.name, pa.variants FROM rsvps rr
                 JOIN users u ON u.id = rr.user_id
                 LEFT JOIN media_assets pa ON pa.id = u.photo_asset_id
                WHERE rr.event_id = e.id AND rr.status IN ('confirmed','approved') AND u.show_presence AND u.status = 'active'
                ORDER BY rr.updated_at DESC LIMIT 5) pg) AS "peopleGoing"
    FROM events e
    JOIN event_types t ON t.slug = e.type_slug
    JOIN organizers o ON o.id = e.organizer_id
    LEFT JOIN users ou ON ou.id = o.user_id
    LEFT JOIN media_assets oa ON oa.id = o.avatar_asset_id
    LEFT JOIN media_assets ca ON ca.id = e.cover_asset_id
    LEFT JOIN interests i ON i.event_id = e.id AND i.user_id = ${viewer}
    LEFT JOIN rsvps r ON r.event_id = e.id AND r.user_id = ${viewer}`;
}

export async function findEvents(db: DbOrTx, opts: ReadOpts, where: SQL, tail: SQL = sql``): Promise<EventRecord[]> {
  return rows<EventRecord>(db, sql`${eventSelect(opts)} WHERE ${where} ${tail}`);
}

export async function findEventBy(db: DbOrTx, opts: ReadOpts, where: SQL): Promise<EventRecord | null> {
  const [r] = await findEvents(db, opts, where, sql`LIMIT 1`);
  return r ?? null;
}

/** RN-10: organizador bloqueado sai da descoberta. */
export const discoverableWhere = (now: Date): SQL => sql`
  e.status = 'published'
  AND (ou.id IS NULL OR ou.status = 'active')
  AND e.ends_at > ${now}
  AND (e.visibility = 'public' OR e.private_discoverable)`;
