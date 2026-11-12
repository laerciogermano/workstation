/** Formatação pt-BR compartilhada (insights no servidor e UI no cliente). */
import type { IsoDate } from './dates';

export const n0 = (v: number): string => Math.round(v).toLocaleString('pt-BR');
export const n1 = (v: number): string =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** Sinal tipográfico: +1,2 · −0,5 · 0,0 */
export const sgn = (v: number, f: (x: number) => string = n1): string =>
  (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v));
export const dfmt = (d: IsoDate): string =>
  new Date(`${d}T12:00:00Z`)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .replace('.', '');
