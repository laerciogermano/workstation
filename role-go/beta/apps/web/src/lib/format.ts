/** Formatação na borda: tudo vem em UTC e é exibido em America/Sao_Paulo (RNF-09). */
export const TZ = 'America/Sao_Paulo';

const parts = (d: Date, tz = TZ) => {
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(d)) p[x.type] = x.value;
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: p.hour ?? '00', min: p.minute ?? '00', wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday ?? 'Sun') };
};
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Número do dia local (para comparar Hoje/Amanhã). */
export const localDayNumber = (d: Date, tz = TZ): number => {
  const p = parts(d, tz);
  return Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86400_000);
};

export const hhmm = (iso: string, tz = TZ): string => {
  const p = parts(new Date(iso), tz);
  return `${p.h}:${p.min}`;
};

export function dayLabel(iso: string, now = new Date(), tz = TZ): string {
  const d = new Date(iso);
  const diff = localDayNumber(d, tz) - localDayNumber(now, tz);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  const p = parts(d, tz);
  return `${WD[p.wd]}, ${p.d} ${MON[p.m - 1]}`;
}

/** "Sáb, 15 nov · 22:00–06:00" */
export function whenLabel(startsAt: string, endsAt: string, now = new Date(), tz = TZ): string {
  return `${dayLabel(startsAt, now, tz)} · ${hhmm(startsAt, tz)}–${hhmm(endsAt, tz)}`;
}

export const endsNextDay = (startsAt: string, endsAt: string, tz = TZ): boolean => localDayNumber(new Date(endsAt), tz) > localDayNumber(new Date(startsAt), tz);

export function relativeStart(startsAt: string, now = new Date()): string {
  const days = localDayNumber(new Date(startsAt)) - localDayNumber(now);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'amanhã';
  return `em ${days} dias`;
}

export function endsIn(endsAt: string, now = new Date()): string {
  const mins = Math.max(0, Math.round((new Date(endsAt).getTime() - now.getTime()) / 60000));
  if (mins < 60) return `termina em ${mins} min`;
  return `termina em ${Math.round(mins / 60)} h`;
}

export function distanceLabel(km: number | null, visibility: 'public' | 'private'): string {
  if (km === null) return '';
  if (visibility === 'private') return `~${Math.round(km)} km`;
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export const money = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents % 100 ? 2 : 0 });

export function priceLabel(e: { isFree: boolean; priceFromCents: number | null }): string | null {
  if (e.isFree) return 'Grátis';
  if (e.priceFromCents) return `a partir de ${money(e.priceFromCents)}`;
  return null;
}

export type FeedGroup = 'today' | 'tomorrow' | 'weekend' | 'next';
/** Agrupamento do feed (feito no front, docs/05 §4.1). Evento ao vivo cai em "Hoje". */
export function feedGroup(startsAt: string, endsAt: string, now = new Date(), tz = TZ): FeedGroup {
  const today = localDayNumber(now, tz);
  const live = new Date(startsAt).getTime() <= now.getTime() && new Date(endsAt).getTime() > now.getTime();
  const day = live ? today : localDayNumber(new Date(startsAt), tz);
  if (day <= today) return 'today';
  if (day === today + 1) return 'tomorrow';
  const wd = parts(now, tz).wd;
  const inWeekend = wd === 5 || wd === 6 || wd === 0;
  const fri = inWeekend ? today : today + ((5 - wd + 7) % 7);
  const sun = inWeekend ? today + ((7 - wd) % 7) : fri + 2;
  if (day >= fri && day <= sun) return 'weekend';
  return 'next';
}

/** datetime-local (fuso de SP) ⇄ ISO UTC. SP é UTC-3 fixo desde 2019. */
export function toLocalInput(iso: string | null | undefined, tz = TZ): string {
  if (!iso) return '';
  const p = parts(new Date(iso), tz);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}T${p.h}:${p.min}`;
}
export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const initials = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';
