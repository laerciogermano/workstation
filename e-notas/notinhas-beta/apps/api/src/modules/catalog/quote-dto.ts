import type { QuoteDTO } from '@notinhas/contracts';
import { quoteBasket, type Coordinates } from '@notinhas/domain';
import { distanceTo } from './catalog.service.js';
import type { IndexSnapshot } from './price-index.js';

/** Cotação “uma loja” / “dividir” (T-41/T-42) — compartilhada entre listas e notas. */
export function toQuoteDto(snap: IndexSnapshot, items: { gtin: string; quantity: number }[], anchor: Coordinates): QuoteDTO {
  const q = quoteBasket(snap.observations, items, [...snap.stores.keys()], snap.at);
  const ref = (id: number) => {
    const s = snap.stores.get(id);
    return { store: { id, name: s?.name ?? `Loja ${id}`, neighborhood: s?.neighborhood ?? null }, distanceKm: distanceTo(s, anchor) };
  };
  const lines = (ls: readonly { gtin: string; quantity: number; unitCents: number; subtotalCents: number; observedAt: Date }[]) =>
    ls.map((l) => ({ ...l, observedAt: l.observedAt.toISOString() }));
  const splitStores = q.split.stores.map((s) => ({ ...ref(s.storeId), subtotalCents: s.subtotalCents, lines: lines(s.lines) }));
  const dists = splitStores.map((s) => s.distanceKm);
  return {
    byStore: q.byStore.map((s) => ({
      ...ref(s.storeId),
      totalCents: s.totalCents,
      found: s.found,
      missing: [...s.missing],
      coverage: s.coverage,
      lines: lines(s.lines),
    })),
    split: {
      stores: splitStores,
      totalCents: q.split.totalCents,
      uncovered: [...q.split.uncovered],
      totalDistanceKm: dists.every((d) => d !== null) ? dists.reduce<number>((a, d) => a + (d ?? 0), 0) : null,
    },
    referenceStoreId: q.reference?.storeId ?? null,
    partial: q.partial,
    savingCents: q.savingCents,
    savingRatio: q.savingRatio,
  };
}
