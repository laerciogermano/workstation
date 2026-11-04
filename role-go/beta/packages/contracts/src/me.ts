import { z } from 'zod';
import { CityRef, LatLng, OriginMode, OrganizerKind, RADIUS_MAX_KM, RADIUS_MIN_KM } from './common';

export const DAY_FILTERS = ['today', 'tomorrow', 'fri', 'sat', 'sun', 'weekend'] as const;
export const DayFilter = z.enum(DAY_FILTERS);
export type DayFilter = z.infer<typeof DayFilter>;

export const DiscoveryFilters = z.object({
  types: z.array(z.string().max(40)).max(20).default([]),
  days: z.array(DayFilter).max(6).default([]),
  range: z.object({ from: z.string().datetime(), to: z.string().datetime() }).nullable().default(null),
  freeOnly: z.boolean().default(false),
});
export type DiscoveryFilters = z.infer<typeof DiscoveryFilters>;

export const OrganizerRef = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  displayName: z.string(),
  kind: OrganizerKind,
});
export type OrganizerRef = z.infer<typeof OrganizerRef>;

export const Me = z.object({
  id: z.string().uuid(),
  email: z.string(),
  emailVerified: z.boolean(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  needsConsent: z.boolean(),
  onboarded: z.boolean(),
  hasPasskey: z.boolean(),
  createdAt: z.string(),
  preferences: z.object({
    eventTypes: z.array(z.string()),
    city: CityRef.nullable(),
    originMode: OriginMode,
    location: LatLng.nullable(),
    overrideCity: CityRef.nullable(),
    radiusKm: z.number(),
    filters: DiscoveryFilters,
  }),
  privacy: z.object({ showPresence: z.boolean() }),
  organizer: OrganizerRef.nullable(),
  stats: z.object({ attended: z.number(), upcoming: z.number(), reviews: z.number() }),
});
export type Me = z.infer<typeof Me>;

export const UpdateMeBody = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;

export const PreferencesBody = z.object({
  eventTypes: z.array(z.string().max(40)).min(1, 'Escolha pelo menos 1 tipo').max(20).optional(),
  cityId: z.string().uuid().optional(),
  originMode: OriginMode.optional(),
  location: LatLng.nullable().optional(),
  overrideCityId: z.string().uuid().nullable().optional(),
  radiusKm: z.number().int().min(RADIUS_MIN_KM).max(RADIUS_MAX_KM).optional(),
  filters: DiscoveryFilters.partial().optional(),
});
export type PreferencesBody = z.infer<typeof PreferencesBody>;

export const PrivacyBody = z.object({ showPresence: z.boolean() });
export const DeleteMeBody = z.object({ confirm: z.literal('EXCLUIR', { errorMap: () => ({ message: 'Digite EXCLUIR' }) }) });
export const MyRsvpsQuery = z.object({ scope: z.enum(['upcoming', 'past']).default('upcoming') });
