import { z } from 'zod';
import { RsvpStatus } from './common';

export const Counts = z.object({ interested: z.number(), going: z.number() });
export type Counts = z.infer<typeof Counts>;
export const InterestResult = z.object({ interested: z.boolean(), counts: Counts });
export const RsvpBody = z.object({ accessCode: z.string().trim().max(12).optional() });
export const RsvpResult = z.object({ status: RsvpStatus, counts: Counts });
export type RsvpResult = z.infer<typeof RsvpResult>;
export const AccessCodeBody = z.object({ code: z.string().trim().toUpperCase().min(4).max(12) });
export const PeopleQuery = z.object({ kind: z.enum(['going', 'interested']).default('going'), cursor: z.string().max(200).optional() });
