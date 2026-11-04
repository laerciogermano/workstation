import { ACCESS_CODE_ALPHABET, MAX_DURATION_H, type Phase, type PublishField } from '@rolego/contracts';
import { err, ok, type Result } from '../../../shared/kernel/result';

/** ADR-015: a fase é calculada pelo relógio, nunca persistida. */
export function phaseOf(startsAt: Date, endsAt: Date, now: Date): Phase {
  if (now.getTime() >= endsAt.getTime()) return 'ended';
  if (now.getTime() >= startsAt.getTime()) return 'live';
  return 'upcoming';
}

export type TimeRangeInput = { startsAt: Date | null; endsAt: Date | null };

/** RN-12: fim depois do início e duração de até 48 h. */
export function validateTimeRange(t: TimeRangeInput): Result<void> {
  if (!t.startsAt || !t.endsAt) return ok(undefined);
  const dur = t.endsAt.getTime() - t.startsAt.getTime();
  if (dur <= 0) return err('VALIDATION_FAILED', 'O fim precisa ser depois do início.');
  if (dur > MAX_DURATION_H * 3600_000) return err('VALIDATION_FAILED', 'A duração máxima é de 48 horas.');
  return ok(undefined);
}

export type PublishableEvent = {
  title: string;
  typeSlug: string;
  hasCover: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  venueName: string;
  hasLocation: boolean;
};

/** Validação completa antes de publicar (RF-E02-04, RN-12). */
export function publishCheck(e: PublishableEvent, now: Date): PublishField[] {
  const missing: PublishField[] = [];
  if (e.title.trim().length < 3) missing.push('title');
  if (!e.typeSlug) missing.push('type');
  if (!e.hasCover) missing.push('cover');
  if (!e.startsAt) missing.push('startsAt');
  if (!e.endsAt) missing.push('endsAt');
  if (e.startsAt && e.endsAt) {
    if (!validateTimeRange({ startsAt: e.startsAt, endsAt: e.endsAt }).ok) missing.push('duration');
  }
  if (e.startsAt && e.startsAt.getTime() <= now.getTime()) missing.push('startInFuture');
  if (e.venueName.trim().length < 2) missing.push('venue');
  if (!e.hasLocation) missing.push('location');
  return missing;
}

export type EventState = { status: 'draft' | 'published' | 'cancelled' | 'removed'; endsAt: Date | null };

/** Pode editar? Encerrado não; cancelado/removido não. */
export function canEdit(e: EventState, now: Date): Result<void> {
  if (e.status === 'cancelled' || e.status === 'removed') return err('EVENT_UNAVAILABLE');
  if (e.endsAt && e.status === 'published' && now.getTime() >= e.endsAt.getTime()) return err('EVENT_NOT_EDITABLE');
  return ok(undefined);
}

export type ScheduleSnapshot = { startsAt: Date | null; endsAt: Date | null; lat: number | null; lng: number | null };

/** RN-08: mudar início, fim ou local notifica os confirmados; título/descrição não. */
export function scheduleChanged(before: ScheduleSnapshot, after: ScheduleSnapshot): boolean {
  const t = (d: Date | null) => d?.getTime() ?? null;
  const geo = (v: number | null) => (v === null ? null : Math.round(v * 1e5));
  return (
    t(before.startsAt) !== t(after.startsAt) ||
    t(before.endsAt) !== t(after.endsAt) ||
    geo(before.lat) !== geo(after.lat) ||
    geo(before.lng) !== geo(after.lng)
  );
}

/** Código de 6 caracteres sem letras ambíguas (T-43). `rand` injetável para teste. */
export function generateAccessCode(rand: (max: number) => number, length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ACCESS_CODE_ALPHABET[rand(ACCESS_CODE_ALPHABET.length)];
  return out;
}

/** "a partir de R$ X" e selo Grátis (sem itens = grátis). */
export function priceSummary(items: { priceCents: number | null }[]): { priceFromCents: number | null; isFree: boolean } {
  const priced = items.map((i) => i.priceCents).filter((p): p is number => p !== null && p > 0);
  const isFree = items.length === 0 || (priced.length === 0 && items.every((i) => i.priceCents === 0));
  return { priceFromCents: priced.length ? Math.min(...priced) : null, isFree };
}

/** RN-07: avaliar entre endsAt e endsAt + 7 dias. */
export function reviewWindowOpen(endsAt: Date, now: Date, days = 7): boolean {
  const t = now.getTime();
  return t >= endsAt.getTime() && t <= endsAt.getTime() + days * 86400_000;
}
