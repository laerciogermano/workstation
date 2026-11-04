import type { DayFilter } from '@rolego/contracts';
import { localParts, startOfLocalDay } from '../../../shared/kernel/tz';

export type Interval = { from: Date; to: Date };

const WEEKDAY: Record<'fri' | 'sat' | 'sun', number> = { fri: 5, sat: 6, sun: 0 };

/** Converte filtros de dia (Hoje, Amanhã, Sex, Sáb, Dom, Fim de semana) em intervalos UTC no fuso da cidade. */
export function dayIntervals(days: readonly DayFilter[], now: Date, tz: string): Interval[] {
  const today = localParts(now, tz).weekday;
  const day = (offset: number): Interval => ({ from: startOfLocalDay(now, tz, offset), to: startOfLocalDay(now, tz, offset + 1) });
  const nextWeekday = (wd: number) => (wd - today + 7) % 7;
  const out: Interval[] = [];
  for (const d of days) {
    if (d === 'today') out.push(day(0));
    else if (d === 'tomorrow') out.push(day(1));
    else if (d === 'weekend') {
      // sexta 00:00 → segunda 00:00; se já estamos no fim de semana, começa hoje
      const inWeekend = today === 5 || today === 6 || today === 0;
      const startOffset = inWeekend ? 0 : nextWeekday(5);
      const endOffset = inWeekend ? (today === 0 ? 1 : nextWeekday(1)) : nextWeekday(5) + 3;
      out.push({ from: startOfLocalDay(now, tz, startOffset), to: startOfLocalDay(now, tz, endOffset) });
    } else out.push(day(nextWeekday(WEEKDAY[d])));
  }
  return out;
}

/** Cursor opaco (starts_at, id) ou deslocamento, em base64url. */
export type Cursor = { k: 't'; s: string; id: string } | { k: 'o'; o: number };
export const encodeCursor = (c: Cursor): string => Buffer.from(JSON.stringify(c)).toString('base64url');
export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Cursor;
    if (c.k === 't' && typeof c.s === 'string' && typeof c.id === 'string' && !Number.isNaN(Date.parse(c.s))) return c;
    if (c.k === 'o' && Number.isInteger(c.o) && c.o >= 0 && c.o < 10_000) return c;
  } catch {
    /* cursor inválido = primeira página */
  }
  return null;
}
