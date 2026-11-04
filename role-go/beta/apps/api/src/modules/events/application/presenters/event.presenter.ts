import type { EventCard, EventDetail, MediaRef, OrganizerEventCard, PersonRef } from '@rolego/contracts';
import { env } from '../../../../shared/env';
import { mediaUrl } from '../../../../shared/media/storage';
import { phaseOf, priceSummary } from '../../domain/event';
import type { EventRecord } from '../../infra/event-read';
import { canSeeAccessCode, canSeeExactAddress, isGoing, presentDistance, type ViewerContext } from '../policies/access.policy';
import type { MediaVariants } from '../../../../shared/db/schema';

/**
 * ÚNICO ponto de saída de evento (docs/03 §5.4).
 * Privado sem aprovação: sem rua, número, complemento, CEP e coordenadas; distância arredondada a 1 km.
 */
export function viewerFor(rec: EventRecord, viewer: { userId: string; role: 'user' | 'admin' } | null): ViewerContext {
  return {
    userId: viewer?.userId ?? null,
    isAdmin: viewer?.role === 'admin',
    isOrganizer: !!viewer && rec.orgUserId === viewer.userId,
    rsvpStatus: viewer ? rec.viewerRsvp : null,
  };
}

const person = (p: { id: string; name: string; photo: MediaVariants | null }): PersonRef => ({
  id: p.id,
  name: p.name,
  photoUrl: mediaUrl(p.photo?.['md']),
});

const ratingOf = (sum: number, count: number) => (count > 0 ? { avg: Math.round((sum / count) * 10) / 10, count } : null);

export function toEventCard(rec: EventRecord, v: ViewerContext, now: Date): EventCard {
  const locked = !canSeeExactAddress(v, rec);
  const startsAt = rec.startsAt ?? now;
  const endsAt = rec.endsAt ?? now;
  const { priceFromCents, isFree } = priceSummary(rec.priceItems);
  return {
    id: rec.id,
    slug: rec.slug,
    title: rec.title,
    type: { slug: rec.typeSlug, label: rec.typeLabel, accent: rec.typeAccent },
    coverUrl: mediaUrl(rec.coverVariants?.['card']),
    coverThumbUrl: mediaUrl(rec.coverVariants?.['thumb']),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    scheduled: rec.startsAt !== null && rec.endsAt !== null,
    timezone: rec.timezone,
    phase: phaseOf(startsAt, endsAt, now),
    status: rec.status,
    ageRating: rec.ageRating,
    venue: { name: rec.venueName, neighborhood: rec.neighborhood, city: rec.cityName },
    distanceKm: presentDistance(rec.distanceKm, locked),
    visibility: rec.visibility,
    priceFromCents,
    isFree,
    counts: { interested: rec.interestsCount, going: rec.goingCount },
    viewer: { interested: v.userId ? rec.viewerInterested : false, rsvp: v.rsvpStatus },
    organizer: { slug: rec.orgSlug, name: rec.orgName, avatarUrl: mediaUrl(rec.orgAvatar?.['md']) },
    peoplePreview: rec.peopleGoing.slice(0, 3).map(person),
  };
}

export type DetailExtras = {
  gallery: MediaRef[];
  peopleInterested: { id: string; name: string; photo: MediaVariants | null }[];
  organizerRating: { avg: number; count: number } | null;
  organizerEventsCount: number;
  canReview: boolean;
};

export function toEventDetail(rec: EventRecord, v: ViewerContext, now: Date, x: DetailExtras): EventDetail {
  const card = toEventCard(rec, v, now);
  const open = canSeeExactAddress(v, rec);
  const venue: EventDetail['venue'] = { ...card.venue, addressLocked: !open };
  if (open) {
    if (rec.street) venue.street = rec.street;
    if (rec.number) venue.number = rec.number;
    if (rec.complement) venue.complement = rec.complement;
    if (rec.cep) venue.cep = rec.cep;
    if (rec.lat !== null && rec.lng !== null) venue.location = { lat: rec.lat, lng: rec.lng };
  }
  const detail: EventDetail = {
    ...card,
    description: rec.description,
    venue,
    priceItems: rec.priceItems,
    externalTicketUrl: rec.externalTicketUrl,
    capacity: rec.capacity,
    isFull: rec.capacity !== null && rec.goingCount >= rec.capacity,
    rating: ratingOf(rec.ratingSum, rec.ratingCount),
    gallery: x.gallery,
    seriesId: rec.seriesId,
    cancelReason: rec.status === 'cancelled' ? rec.cancelReason : null,
    people: { going: rec.peopleGoing.map(person), interested: x.peopleInterested.map(person) },
    shareUrl: `${env().APP_URL}/e/${rec.slug}`,
    privateDiscoverable: rec.privateDiscoverable,
    organizerInfo: {
      slug: rec.orgSlug,
      name: rec.orgName,
      kind: rec.orgKind,
      avatarUrl: mediaUrl(rec.orgAvatar?.['md']),
      rating: x.organizerRating,
      eventsCount: x.organizerEventsCount,
    },
    viewer: {
      ...card.viewer,
      canReview: x.canReview && isGoing(v.rsvpStatus),
      isOrganizer: v.isOrganizer,
      hereAt: rec.viewerHereAt?.toISOString() ?? null,
    },
  };
  if (canSeeAccessCode(v)) {
    detail.organizerView = {
      accessCode: rec.accessCode,
      approvalMode: rec.approvalMode,
      pendingCount: rec.pendingCount,
      views: rec.viewsCount,
    };
  }
  return detail;
}

export function toOrganizerEventCard(rec: EventRecord, now: Date): OrganizerEventCard {
  const v: ViewerContext = { userId: rec.orgUserId, isAdmin: false, isOrganizer: true, rsvpStatus: null };
  return {
    ...toEventCard(rec, v, now),
    metrics: { interested: rec.interestsCount, going: rec.goingCount, pending: rec.pendingCount, views: rec.viewsCount },
  };
}

export const ratingFrom = ratingOf;
