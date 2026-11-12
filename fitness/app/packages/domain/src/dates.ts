/** Datas de calendário no formato ISO `AAAA-MM-DD` (dia local do usuário, sem hora). */
export type IsoDate = string;

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MS_DAY = 86_400_000;
const toUtcNoon = (d: IsoDate): number => Date.parse(`${d}T12:00:00Z`);

export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((toUtcNoon(b) - toUtcNoon(a)) / MS_DAY);
}

export function addDays(d: IsoDate, n: number): IsoDate {
  return new Date(toUtcNoon(d) + n * MS_DAY).toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado */
export function weekday(d: IsoDate): number {
  return new Date(toUtcNoon(d)).getUTCDay();
}

/** Últimos `n` dias terminando em `end` (inclusive), do mais antigo ao mais novo. */
export function lastDays(end: IsoDate, n: number): IsoDate[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

export const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
