import type { Cents } from './money.js';
import { cents } from './money.js';
import type { PriceObservation } from './pricing.js';
import { QUOTE_WINDOW_DAYS, latestByStore } from './pricing.js';

export interface BasketItem {
  readonly gtin: string;
  readonly quantity: number;
}

export interface StoreQuote {
  readonly storeId: number;
  readonly totalCents: Cents;
  readonly found: number;
  readonly missing: readonly string[];
  /** 0..1 */
  readonly coverage: number;
  readonly lines: readonly QuoteLine[];
}

export interface QuoteLine {
  readonly gtin: string;
  readonly quantity: number;
  readonly unitCents: Cents;
  readonly subtotalCents: Cents;
  readonly observedAt: Date;
}

export interface SplitPlan {
  readonly stores: readonly { storeId: number; subtotalCents: Cents; lines: readonly QuoteLine[] }[];
  readonly totalCents: Cents;
  /** EANs sem nenhum preço na janela — nunca interpolados (RN-13) */
  readonly uncovered: readonly string[];
}

export interface BasketQuote {
  /** “Uma loja”: ordenado por cobertura desc, depois total asc */
  readonly byStore: readonly StoreQuote[];
  /** “Dividir entre lojas”: cada item na loja mais barata */
  readonly split: SplitPlan;
  /** Melhor loja única com a maior cobertura possível */
  readonly reference: StoreQuote | null;
  /** Referência não cobre tudo o que o split cobre → comparação é parcial (explicitar na UI) */
  readonly partial: boolean;
  /** Economia do split vs a referência, só sobre os itens que a referência tem */
  readonly savingCents: Cents;
  readonly savingRatio: number;
}

/** RN-13: cotação sem interpolar preço ausente. Função pura. */
export function quoteBasket(
  obs: readonly PriceObservation[],
  items: readonly BasketItem[],
  storeIds: readonly number[],
  now: Date,
): BasketQuote {
  const offers = new Map(items.map((it) => [it.gtin, latestByStore(obs, it.gtin, now, QUOTE_WINDOW_DAYS)]));
  const line = (it: BasketItem, o: PriceObservation): QuoteLine => ({
    gtin: it.gtin,
    quantity: it.quantity,
    unitCents: o.priceCents,
    subtotalCents: cents(o.priceCents * it.quantity),
    observedAt: o.observedAt,
  });

  const byStore: StoreQuote[] = storeIds
    .map((storeId) => {
      const lines: QuoteLine[] = [];
      const missing: string[] = [];
      for (const it of items) {
        const o = offers.get(it.gtin)?.find((x) => x.storeId === storeId);
        if (o) lines.push(line(it, o));
        else missing.push(it.gtin);
      }
      const totalCents = cents(lines.reduce((a, l) => a + l.subtotalCents, 0));
      return { storeId, totalCents, found: lines.length, missing, coverage: items.length ? lines.length / items.length : 0, lines };
    })
    .filter((q) => q.found > 0)
    .sort((a, b) => b.found - a.found || a.totalCents - b.totalCents);

  const splitStores = new Map<number, QuoteLine[]>();
  const uncovered: string[] = [];
  for (const it of items) {
    const best = offers.get(it.gtin)?.find((o) => storeIds.includes(o.storeId));
    if (!best) {
      uncovered.push(it.gtin);
      continue;
    }
    const arr = splitStores.get(best.storeId) ?? [];
    arr.push(line(it, best));
    splitStores.set(best.storeId, arr);
  }
  const stores = [...splitStores.entries()]
    .map(([storeId, lines]) => ({ storeId, lines, subtotalCents: cents(lines.reduce((a, l) => a + l.subtotalCents, 0)) }))
    .sort((a, b) => b.subtotalCents - a.subtotalCents);
  const split: SplitPlan = { stores, totalCents: cents(stores.reduce((a, s) => a + s.subtotalCents, 0)), uncovered };

  const coverable = items.length - uncovered.length;
  const reference = byStore.find((q) => q.found === coverable) ?? byStore[0] ?? null;
  let savingCents = cents(0);
  let savingRatio = 0;
  if (reference) {
    const has = new Set(reference.lines.map((l) => l.gtin));
    const splitOnRef = stores.flatMap((s) => s.lines).filter((l) => has.has(l.gtin)).reduce((a, l) => a + l.subtotalCents, 0);
    savingCents = cents(reference.totalCents - splitOnRef);
    savingRatio = reference.totalCents ? savingCents / reference.totalCents : 0;
  }
  return { byStore, split, reference, partial: reference ? reference.found < coverable : false, savingCents, savingRatio };
}
