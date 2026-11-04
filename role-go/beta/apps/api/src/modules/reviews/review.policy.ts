import { GOING_STATUSES, REVIEW_WINDOW_DAYS, type RsvpStatus } from '@rolego/contracts';
import { err, ok, type Result } from '../../shared/kernel/result';

/** RN-07: só quem foi (confirmed/approved), entre o fim e fim + 7 dias. */
export function canReview(rsvp: RsvpStatus | null, endsAt: Date | null, now: Date): Result<void> {
  if (!rsvp || !GOING_STATUSES.includes(rsvp)) return err('REVIEW_NOT_ALLOWED');
  if (!endsAt || now.getTime() < endsAt.getTime()) return err('REVIEW_NOT_ALLOWED', 'Avalie depois que o rolê acabar.');
  if (now.getTime() > endsAt.getTime() + REVIEW_WINDOW_DAYS * 86400_000) return err('REVIEW_WINDOW_CLOSED');
  return ok(undefined);
}

const BAD_WORDS = ['porra', 'caralho', 'merda', 'puta', 'buceta', 'viado', 'fdp', 'arrombado', 'cacete', 'desgraça'];

/** Filtro de conteúdo: bloqueia links e mascara palavrões (T-25). */
export function filterComment(raw: string | undefined): Result<string | null> {
  const c = raw?.trim();
  if (!c) return ok(null);
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|br|io|me)\b)/i.test(c)) return err('VALIDATION_FAILED', 'Comentários não podem ter links.');
  let out = c;
  for (const w of BAD_WORDS) out = out.replace(new RegExp(`\\b${w}\\b`, 'gi'), (m) => m[0] + '*'.repeat(m.length - 1));
  return ok(out);
}
