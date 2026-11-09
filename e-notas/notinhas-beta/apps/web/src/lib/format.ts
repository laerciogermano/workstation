import { formatBrl, formatKm, formatPct } from '@notinhas/domain';

export const brl = formatBrl;
export const km = (v: number | null | undefined) => (v === null || v === undefined ? '' : formatKm(v));
export const pct = formatPct;

const DAY = 86_400_000;
const tz = 'America/Sao_Paulo';

/** Dia civil da NFC-e em Brasília (YYYY-MM-DD) — não usar slice UTC. */
export function calendarDay(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz });
}

/** “hoje” · “ontem” · “há 3 dias” — relativo à data de emissão da nota (RN-05). */
export function when(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = Math.floor((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}
function startOfDay(d: Date): number {
  const s = d.toLocaleDateString('en-CA', { timeZone: tz });
  // Âncora meio-dia UTC evita virar o dia ao interpretar YYYY-MM-DD sem fuso.
  return new Date(`${s}T12:00:00Z`).getTime();
}
export const dateShort = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: tz }) : '');
/** Data/hora de emissão da NFC-e (Brasília) — fonte do histórico, não a ingestão. */
export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: tz }).replace(',', ' às') : '';
export const monthLabel = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
