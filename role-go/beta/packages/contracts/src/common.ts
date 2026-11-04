import { z } from 'zod';

export const RADIUS_MIN_KM = 1;
export const RADIUS_MAX_KM = 100;
export const RADIUS_DEFAULT_KM = 20;
export const PAGE_LIMIT = 20;

export const ACCENTS = ['cyan', 'magenta', 'yellow', 'green', 'violet'] as const;
export const Accent = z.enum(ACCENTS);
export type Accent = z.infer<typeof Accent>;

export const Uuid = z.string().uuid();
export const LatLng = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
export type LatLng = z.infer<typeof LatLng>;

export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });
export type Page<T> = { items: T[]; nextCursor: string | null };

export const CursorQuery = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(PAGE_LIMIT),
});

export const RSVP_STATUSES = [
  'pending',
  'confirmed',
  'approved',
  'declined',
  'cancelled_by_user',
  'cancelled_by_event',
] as const;
export const RsvpStatus = z.enum(RSVP_STATUSES);
export type RsvpStatus = z.infer<typeof RsvpStatus>;
export const GOING_STATUSES: readonly RsvpStatus[] = ['confirmed', 'approved'];

export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'removed'] as const;
export const EventStatus = z.enum(EVENT_STATUSES);
export type EventStatus = z.infer<typeof EventStatus>;

export const PHASES = ['upcoming', 'live', 'ended'] as const;
export const Phase = z.enum(PHASES);
export type Phase = z.infer<typeof Phase>;

export const AgeRating = z.enum(['free', '16', '18']);
export type AgeRating = z.infer<typeof AgeRating>;
export const Visibility = z.enum(['public', 'private']);
export type Visibility = z.infer<typeof Visibility>;
export const ApprovalMode = z.enum(['manual', 'auto']);
export type ApprovalMode = z.infer<typeof ApprovalMode>;
export const OrganizerKind = z.enum(['person', 'bar', 'venue', 'producer']);
export type OrganizerKind = z.infer<typeof OrganizerKind>;
export const OriginMode = z.enum(['gps', 'city', 'override']);
export type OriginMode = z.infer<typeof OriginMode>;

export const CityRef = z.object({ id: Uuid, name: z.string(), uf: z.string(), launchStatus: z.enum(['live', 'soon']) });
export type CityRef = z.infer<typeof CityRef>;

export const PersonRef = z.object({ id: Uuid, name: z.string(), photoUrl: z.string().nullable() });
export type PersonRef = z.infer<typeof PersonRef>;

export const MediaRef = z.object({
  id: Uuid,
  url: z.string(),
  thumbUrl: z.string(),
});
export type MediaRef = z.infer<typeof MediaRef>;

/** Strings vindas de query (?types=a,b) viram array. */
export const csv = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean));
