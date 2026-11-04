import { z } from 'zod';
import { Accent, CityRef } from './common';

export const EventTypeDto = z.object({ slug: z.string(), label: z.string(), accent: Accent });
export type EventTypeDto = z.infer<typeof EventTypeDto>;

export const CitiesQuery = z.object({ q: z.string().max(80).optional() });
export const CityDto = CityRef;
export type CityDto = z.infer<typeof CityDto>;

export const CepDto = z.object({ street: z.string(), neighborhood: z.string(), city: z.string(), uf: z.string() });
export type CepDto = z.infer<typeof CepDto>;
