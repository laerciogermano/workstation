import { formatBrl, formatKm, formatPct } from '@notinhas/domain';

export const brl = formatBrl;
export const km = (v: number | null | undefined) => (v === null || v === undefined ? '' : formatKm(v));
export const pct = formatPct;

const DAY = 86_400_000;
const tz = 'America/Sao_Paulo';

/** “hoje” · “ontem” · “há 3 dias” — sempre ao lado de preço (RN-05). */
export function when(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = Math.floor((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}
function startOfDay(d: Date): number {
  const s = d.toLocaleDateString('en-CA', { timeZone: tz });
  return new Date(`${s}T00:00:00`).getTime();
}
export const dateShort = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: tz }) : '');
export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: tz }).replace(',', ' às') : '';
export const monthLabel = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
