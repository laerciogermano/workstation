/** Utilidades de fuso sem dependência (o beta só usa America/Sao_Paulo, mas o evento guarda o tz). */
export type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function localParts(d: Date, tz: string): LocalParts {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(d)) p[part.type] = part.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: WEEKDAYS[p.weekday ?? 'Sun'] ?? 0,
  };
}

/** Offset (ms) do fuso no instante d: local = utc + offset. */
export function tzOffsetMs(d: Date, tz: string): number {
  const p = localParts(d, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(d.getTime() / 60000) * 60000;
}

/** Instante UTC da meia-noite local do dia de `d` + `addDays`. */
export function startOfLocalDay(d: Date, tz: string, addDays = 0): Date {
  const p = localParts(d, tz);
  const guess = new Date(Date.UTC(p.year, p.month - 1, p.day + addDays));
  return new Date(guess.getTime() - tzOffsetMs(guess, tz));
}
