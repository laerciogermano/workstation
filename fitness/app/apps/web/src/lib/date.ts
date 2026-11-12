import type { IsoDate } from '@fitness/domain';

/** Dia de calendário local do usuário (não UTC). */
export function todayLocal(d = new Date()): IsoDate {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return z.toISOString().slice(0, 10);
}

export function longDate(d: IsoDate): string {
  return new Date(`${d}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
    .replace('.', '');
}

export function timeAgo(iso: string, now = Date.now()): string {
  const m = Math.round((now - Date.parse(iso)) / 60_000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}
