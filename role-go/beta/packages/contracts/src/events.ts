import { z } from 'zod';
import {
  Accent,
  AgeRating,
  ApprovalMode,
  LatLng,
  MediaRef,
  OrganizerKind,
  PersonRef,
  Phase,
  RsvpStatus,
  Visibility,
} from './common';

export const MAX_DURATION_H = 48;
export const MAX_PRICE_ITEMS = 10;
export const MAX_GALLERY = 20;
export const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const PriceItem = z.object({
  label: z.string().trim().min(1).max(40),
  priceCents: z.number().int().min(0).max(10_000_000).nullable(),
  note: z.string().trim().max(60).optional(),
});
export type PriceItem = z.infer<typeof PriceItem>;

const httpsUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((u) => u.startsWith('https://'), 'Use um link https://');

export const EventDraftInput = z.object({
  title: z.string().trim().min(3, 'Mínimo de 3 caracteres').max(80),
  typeSlug: z.string().max(40),
  description: z.string().trim().max(3000).optional(),
  ageRating: AgeRating.optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  venueName: z.string().trim().min(2).max(80).optional(),
  visibility: Visibility.optional(),
  privateDiscoverable: z.boolean().optional(),
  approvalMode: ApprovalMode.optional(),
  capacity: z.number().int().min(1).max(100_000).nullable().optional(),
  priceItems: z.array(PriceItem).max(MAX_PRICE_ITEMS).optional(),
  externalTicketUrl: httpsUrl.nullable().optional(),
});
export type EventDraftInput = z.infer<typeof EventDraftInput>;
export const EventPatchInput = EventDraftInput.partial();
export type EventPatchInput = z.infer<typeof EventPatchInput>;

export const GeocodeBody = z.union([
  z.object({
    cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    number: z.string().trim().min(1).max(10),
    complement: z.string().trim().max(60).optional(),
  }),
  LatLng.extend({ venueName: z.string().max(80).optional() }),
]);
export type GeocodeBody = z.infer<typeof GeocodeBody>;

export const VenuePreview = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().nullable(),
  neighborhood: z.string(),
  city: z.string(),
  uf: z.string(),
  cep: z.string(),
  location: LatLng,
  formatted: z.string(),
});
export type VenuePreview = z.infer<typeof VenuePreview>;

export const PUBLISH_FIELDS = ['title', 'type', 'cover', 'startsAt', 'endsAt', 'duration', 'startInFuture', 'venue', 'location'] as const;
export const PublishField = z.enum(PUBLISH_FIELDS);
export type PublishField = z.infer<typeof PublishField>;
export const PublishCheck = z.object({ ok: z.boolean(), missing: z.array(PublishField) });
export type PublishCheck = z.infer<typeof PublishCheck>;

export const CancelBody = z.object({ reason: z.string().trim().min(5, 'Conte o motivo').max(300) });

export const EventTypeRef = z.object({ slug: z.string(), label: z.string(), accent: Accent });

export const EventCard = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  type: EventTypeRef,
  coverUrl: z.string().nullable(),
  coverThumbUrl: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  /** false enquanto o rascunho não tem data (startsAt/endsAt vêm preenchidos com "agora"). */
  scheduled: z.boolean(),
  timezone: z.string(),
  phase: Phase,
  status: z.enum(['draft', 'published', 'cancelled', 'removed']),
  ageRating: AgeRating,
  venue: z.object({ name: z.string(), neighborhood: z.string(), city: z.string() }),
  distanceKm: z.number().nullable(),
  visibility: Visibility,
  priceFromCents: z.number().nullable(),
  isFree: z.boolean(),
  counts: z.object({ interested: z.number(), going: z.number() }),
  viewer: z.object({ interested: z.boolean(), rsvp: RsvpStatus.nullable() }),
  organizer: z.object({ slug: z.string(), name: z.string(), avatarUrl: z.string().nullable() }),
  peoplePreview: z.array(PersonRef),
});
export type EventCard = z.infer<typeof EventCard>;

export const EventDetail = EventCard.extend({
  description: z.string(),
  venue: EventCard.shape.venue.extend({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    cep: z.string().optional(),
    location: LatLng.optional(),
    addressLocked: z.boolean(),
  }),
  priceItems: z.array(PriceItem),
  externalTicketUrl: z.string().nullable(),
  capacity: z.number().nullable(),
  isFull: z.boolean(),
  rating: z.object({ avg: z.number(), count: z.number() }).nullable(),
  gallery: z.array(MediaRef),
  seriesId: z.string().nullable(),
  cancelReason: z.string().nullable(),
  people: z.object({ going: z.array(PersonRef), interested: z.array(PersonRef) }),
  shareUrl: z.string(),
  privateDiscoverable: z.boolean(),
  organizerInfo: z.object({
    slug: z.string(),
    name: z.string(),
    kind: OrganizerKind,
    avatarUrl: z.string().nullable(),
    rating: z.object({ avg: z.number(), count: z.number() }).nullable(),
    eventsCount: z.number(),
  }),
  viewer: EventCard.shape.viewer.extend({ canReview: z.boolean(), isOrganizer: z.boolean(), hereAt: z.string().nullable() }),
  organizerView: z
    .object({
      accessCode: z.string().nullable(),
      approvalMode: ApprovalMode,
      pendingCount: z.number(),
      views: z.number(),
    })
    .optional(),
});
export type EventDetail = z.infer<typeof EventDetail>;

export const OrganizerEventCard = EventCard.extend({
  metrics: z.object({ interested: z.number(), going: z.number(), pending: z.number(), views: z.number() }),
});
export type OrganizerEventCard = z.infer<typeof OrganizerEventCard>;
export const OrganizerEventsQuery = z.object({ tab: z.enum(['upcoming', 'drafts', 'past']).default('upcoming') });

export const OrganizerInput = z.object({
  displayName: z.string().trim().min(2).max(60),
  kind: OrganizerKind,
  bio: z.string().trim().max(300).optional(),
  instagram: z
    .string()
    .trim()
    .regex(/^@?[A-Za-z0-9._]{1,30}$/, 'Instagram inválido')
    .optional(),
});
export type OrganizerInput = z.infer<typeof OrganizerInput>;

export const OrganizerDto = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  displayName: z.string(),
  kind: OrganizerKind,
  bio: z.string().nullable(),
  instagram: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type OrganizerDto = z.infer<typeof OrganizerDto>;

export const OrganizerPublic = OrganizerDto.extend({
  rating: z.object({ avg: z.number(), count: z.number() }).nullable(),
  upcoming: z.array(EventCard),
  past: z.array(EventCard.extend({ rating: z.object({ avg: z.number(), count: z.number() }).nullable() })),
});
export type OrganizerPublic = z.infer<typeof OrganizerPublic>;

export const Guest = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  city: z.string().nullable(),
  attendedCount: z.number(),
  status: RsvpStatus,
  requestedAt: z.string(),
});
export type Guest = z.infer<typeof Guest>;
export const GuestsQuery = z.object({ status: z.enum(['pending', 'going']).default('pending') });
