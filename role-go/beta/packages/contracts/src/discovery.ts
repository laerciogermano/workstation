import { z } from 'zod';
import { CityRef, csv, LatLng, OriginMode, RADIUS_MAX_KM, RADIUS_MIN_KM } from './common';
import { DayFilter } from './me';

export const DiscoveryQuery = z.object({
  types: csv.optional(),
  days: csv.pipe(z.array(DayFilter)).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  radiusKm: z.coerce.number().int().min(RADIUS_MIN_KM).max(RADIUS_MAX_KM).optional(),
  freeOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  /** Visitante: cidade explícita (sem preferências salvas). */
  cityId: z.string().uuid().optional(),
  /** Visitante: GPS explícito. */
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  cursor: z.string().max(200).optional(),
  sort: z.enum(['soonest', 'nearest']).default('soonest'),
});
export type DiscoveryQuery = z.infer<typeof DiscoveryQuery>;

export const SearchQuery = z.object({
  q: z.string().trim().min(2).max(80),
  scope: z.enum(['radius', 'city']).default('radius'),
  cursor: z.string().max(200).optional(),
});

export const Origin = z.object({
  mode: OriginMode,
  label: z.string(),
  city: CityRef.nullable(),
  point: LatLng,
  radiusKm: z.number(),
});
export type Origin = z.infer<typeof Origin>;
