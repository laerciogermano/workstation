const TZ = 'America/Sao_Paulo';
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...o });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const time = (iso: string) => f({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
export const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
export const dayNumber = (iso: string) => f({ day: '2-digit' }).format(new Date(iso));
export const month = (iso: string) => f({ month: 'short' }).format(new Date(iso)).replace('.', '').toUpperCase();
export const weekShort = (iso: string) => cap(f({ weekday: 'short' }).format(new Date(iso)).replace('.', ''));
export const weekLong = (iso: string) => cap(f({ weekday: 'long' }).format(new Date(iso)));
export const dayFull = (iso: string) => `${weekLong(iso).replace('-feira', '')}, ${f({ day: 'numeric', month: 'long' }).format(new Date(iso))}`;
/** datas sem horário (AAAA-MM-DD) */
export const date = (ymd: string) => ymd.slice(0, 10).split('-').reverse().join('/');
export const dateRange = (a: string | null, b: string | null) => (a && b ? `${Number(a.slice(8))} a ${f({ day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${b}T12:00:00-03:00`))}` : 'Data a definir');
export const daysUntil = (ymd: string | null) => (ymd ? Math.max(0, Math.ceil((new Date(`${ymd}T00:00:00-03:00`).getTime() - Date.now()) / 864e5)) : 0);
export function ago(iso: string) {
  const d = new Date(iso), today = dayKey(new Date().toISOString());
  if (dayKey(iso) === today) return time(iso);
  if (dayKey(iso) === dayKey(new Date(Date.now() - 864e5).toISOString())) return 'Ontem';
  return Date.now() - d.getTime() < 6 * 864e5 ? weekShort(iso) : f({ day: '2-digit', month: '2-digit' }).format(d);
}
export const fmt = (n: number) => n.toLocaleString('pt-BR');
export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
export const initials = (n: string) => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const firstName = (n: string) => n.split(' ')[0];
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
export const GOB = (o: string) => o.startsWith('GOB');
export const OBEDIENCES = ['GOB-PR · Grande Oriente do Paraná', 'GOB · outro estado', 'Grande Loja', 'COMAB', 'Potência estrangeira'];
