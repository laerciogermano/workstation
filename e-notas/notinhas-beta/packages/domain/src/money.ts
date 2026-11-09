/** Dinheiro sempre em centavos inteiros; formatação só na borda (08 §2). */
export type Cents = number & { readonly __brand: 'Cents' };

export const cents = (n: number): Cents => Math.round(n) as Cents;

/** "1.234,56" | "12,9" | "R$ 3,99" → centavos. null se não for número. */
export function parseBrl(raw: string | null | undefined): Cents | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[^\d,.-]/g, '');
  if (!s) return null;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? cents(n * 100) : null;
}

/** "3,500" | "1" | "0.75" → número decimal (quantidade da NFC-e). */
export function parseQuantity(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[^\d,.]/g, '');
  if (!s) return null;
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(n) ? n : null;
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** 899 → "R$ 8,99" (troca o NBSP do Intl por espaço normal, como no DESIGN.md). */
export const formatBrl = (c: number): string => fmt.format(c / 100).replace(/\u00a0/g, ' ');

/** -0.1923 → "-19%" */
export const formatPct = (ratio: number): string => `${ratio > 0 ? '+' : ''}${Math.round(ratio * 100)}%`;
