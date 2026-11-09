import type { Cents } from './money.js';
import { median } from './stats.js';

/** Uma observação de preço = um item de NFC-e com EAN vinculado (preço de balcão, RN-08). */
export interface PriceObservation {
  readonly gtin: string;
  readonly storeId: number;
  readonly priceCents: Cents;
  readonly observedAt: Date;
}

/** Q3: índice “quente” de 14 dias; mais velho recebe selo “desatualizado”. */
export const HOT_WINDOW_DAYS = 14;
/** Janela da cotação de listas (RN-13). */
export const QUOTE_WINDOW_DAYS = 30;
/** RN-11 / Q5: destaque = ≥ 5% e ≥ R$ 0,50 abaixo da mediana 14 d, com ≥ 3 lojas. */
export const HIGHLIGHT_MIN_RATIO = 0.05;
export const HIGHLIGHT_MIN_CENTS = 50;
export const HIGHLIGHT_MIN_STORES = 3;

const DAY_MS = 86_400_000;
export const ageDays = (at: Date, now: Date): number => Math.max(0, Math.floor((now.getTime() - at.getTime()) / DAY_MS));
export const isStale = (at: Date, now: Date): boolean => ageDays(at, now) > HOT_WINDOW_DAYS;

/** Última observação de cada loja para um EAN, dentro da janela; ordenado do menor preço. */
export function latestByStore(
  obs: readonly PriceObservation[],
  gtin: string,
  now: Date,
  windowDays = Number.POSITIVE_INFINITY,
): PriceObservation[] {
  const latest = new Map<number, PriceObservation>();
  for (const o of obs) {
    if (o.gtin !== gtin || ageDays(o.observedAt, now) > windowDays) continue;
    const cur = latest.get(o.storeId);
    if (!cur || o.observedAt > cur.observedAt) latest.set(o.storeId, o);
  }
  return [...latest.values()].sort(
    (a, b) => a.priceCents - b.priceCents || b.observedAt.getTime() - a.observedAt.getTime(),
  );
}

/** Menor preço (RN-05): prefere a janela quente; senão o melhor histórico. */
export function bestOffer(obs: readonly PriceObservation[], gtin: string, now: Date): PriceObservation | null {
  return latestByStore(obs, gtin, now, HOT_WINDOW_DAYS)[0] ?? latestByStore(obs, gtin, now)[0] ?? null;
}

export interface Highlight {
  readonly offer: PriceObservation;
  readonly medianCents: number;
  /** negativo: -0.19 = 19% abaixo da mediana */
  readonly ratio: number;
}

/** RN-11: gatilho de destaque. */
export function highlightOf(obs: readonly PriceObservation[], gtin: string, now: Date): Highlight | null {
  const hot = latestByStore(obs, gtin, now, HOT_WINDOW_DAYS);
  const best = hot[0];
  if (!best || hot.length < HIGHLIGHT_MIN_STORES) return null;
  const med = median(hot.map((o) => o.priceCents));
  const isDeal = best.priceCents <= med * (1 - HIGHLIGHT_MIN_RATIO) && med - best.priceCents >= HIGHLIGHT_MIN_CENTS;
  return isDeal ? { offer: best, medianCents: med, ratio: (best.priceCents - med) / med } : null;
}

export interface StoreRank {
  readonly storeId: number;
  /** mediana de (preço da loja / mediana regional − 1); null = dados insuficientes */
  readonly index: number | null;
  readonly comparableProducts: number;
  readonly position: number | null;
  readonly of: number;
}

/**
 * RN-10: ranking por mediana relativa. Para cada EAN com ≥ 2 lojas na janela,
 * compara o preço da loja com a mediana regional; o índice da loja é a mediana desses desvios.
 * Lojas com < `minProducts` EANs comparáveis ficam no fim, sem posição.
 */
export function rankStores(
  obs: readonly PriceObservation[],
  storeIds: readonly number[],
  now: Date,
  minProducts = 2,
): StoreRank[] {
  const gtins = [...new Set(obs.map((o) => o.gtin))];
  const ratios = new Map<number, number[]>(storeIds.map((id) => [id, []]));
  for (const gtin of gtins) {
    const hot = latestByStore(obs, gtin, now, HOT_WINDOW_DAYS).filter((o) => ratios.has(o.storeId));
    if (hot.length < 2) continue;
    const med = median(hot.map((o) => o.priceCents));
    for (const o of hot) ratios.get(o.storeId)?.push(o.priceCents / med - 1);
  }
  const rows = storeIds.map((storeId) => {
    const r = ratios.get(storeId) ?? [];
    return { storeId, index: r.length >= minProducts ? median(r) : null, comparableProducts: r.length };
  });
  const ranked = rows.filter((r) => r.index !== null).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const of = ranked.length;
  return [
    ...ranked.map((r, i) => ({ ...r, position: i + 1, of })),
    ...rows.filter((r) => r.index === null).map((r) => ({ ...r, position: null, of })),
  ];
}
