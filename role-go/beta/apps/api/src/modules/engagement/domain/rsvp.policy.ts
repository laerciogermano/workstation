import { GOING_STATUSES, type RsvpStatus } from '@rolego/contracts';
import { err, ok, type Result } from '../../../shared/kernel/result';

export type RsvpEventFacts = {
  status: 'draft' | 'published' | 'cancelled' | 'removed';
  visibility: 'public' | 'private';
  approvalMode: 'manual' | 'auto';
  ageRating: 'free' | '16' | '18';
  endsAt: Date | null;
  privateDiscoverable: boolean;
  accessCode: string | null;
};
export type RsvpViewerFacts = { adult: boolean; current: RsvpStatus | null; isOrganizer: boolean };
export type RsvpDecision = { kind: 'noop'; status: RsvpStatus } | { kind: 'create'; status: 'confirmed' | 'approved' | 'pending' };

/**
 * RsvpPolicy (RF-E03-04, RN-05, RN-11): público confirma na hora; privado auto aprova; privado manual vira pedido.
 * A capacidade NÃO é verificada aqui: é o UPDATE condicional atômico no banco (docs/05 §4.3).
 */
export function decideRsvp(e: RsvpEventFacts, v: RsvpViewerFacts, providedCode: string | null, now: Date): Result<RsvpDecision> {
  if (e.status !== 'published' || !e.endsAt || now.getTime() >= e.endsAt.getTime()) return err('EVENT_UNAVAILABLE');
  if (e.ageRating === '18' && !v.adult) return err('ADULT_REQUIRED');
  if (v.current && (GOING_STATUSES.includes(v.current) || v.current === 'pending')) return ok({ kind: 'noop', status: v.current });
  if (e.visibility === 'public') return ok({ kind: 'create', status: 'confirmed' });
  const hasAccess =
    v.isOrganizer || e.privateDiscoverable || v.current !== null || (providedCode !== null && e.accessCode !== null && providedCode.toUpperCase() === e.accessCode);
  if (!hasAccess) return err('ACCESS_CODE_INVALID');
  return ok({ kind: 'create', status: e.approvalMode === 'auto' ? 'approved' : 'pending' });
}

/** Cancelar a própria presença: só antes do fim. */
export function canCancelRsvp(current: RsvpStatus | null, endsAt: Date | null, now: Date): Result<void> {
  if (!current || !(GOING_STATUSES.includes(current) || current === 'pending')) return err('NOT_FOUND');
  if (endsAt && now.getTime() >= endsAt.getTime()) return err('EVENT_NOT_EDITABLE');
  return ok(undefined);
}

/** "Estou aqui": só durante LIVE e para quem vai. */
export function canCheckIn(current: RsvpStatus | null, startsAt: Date | null, endsAt: Date | null, now: Date): boolean {
  if (!current || !GOING_STATUSES.includes(current) || !startsAt || !endsAt) return false;
  return now.getTime() >= startsAt.getTime() && now.getTime() < endsAt.getTime();
}
