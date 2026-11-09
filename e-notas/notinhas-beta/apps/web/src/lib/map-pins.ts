import type { HomeDTO, ProductCardDTO, StoreRankDTO } from '@notinhas/contracts';
import { brl } from './format';
import type { MapPin } from '../ui/MapView';

export function pricePinText(cents: number): string {
  return brl(cents).replace(/^R\$\s?/, '');
}

/** Produtos únicos da home (promoções → mais comprados → categorias). */
export function homeProducts(home: HomeDTO | undefined): ProductCardDTO[] {
  if (!home) return [];
  const out: ProductCardDTO[] = [];
  const seen = new Set<string>();
  for (const p of [...home.promotions, ...home.mostBought, ...home.categories.flatMap((c) => c.products)]) {
    if (seen.has(p.gtin)) continue;
    seen.add(p.gtin);
    out.push(p);
  }
  return out;
}

function coordsByStore(ranking: StoreRankDTO[] | undefined): Map<number, { name: string; lat: number; lng: number }> {
  const m = new Map<number, { name: string; lat: number; lng: number }>();
  for (const r of ranking ?? []) {
    if (r.store.lat === null || r.store.lng === null) continue;
    m.set(r.store.id, { name: r.store.name, lat: r.store.lat, lng: r.store.lng });
  }
  return m;
}

/**
 * Pins de produto (preço) — lat/lng = coordenada exata da loja do melhor preço
 * (`best.store` → ranking/`stores.lat|lng`). Sem jitter: vários produtos na mesma
 * loja compartilham o ponto (antes o protótipo espalhava ~120–140 m).
 */
export function productPricePins(
  products: ProductCardDTO[],
  ranking: StoreRankDTO[] | undefined,
  opts: { selectedGtin?: string | null; onSelect?: (gtin: string) => void; limit?: number } = {},
): MapPin[] {
  const coords = coordsByStore(ranking);
  const placed: { p: ProductCardDTO; pin: Omit<MapPin, 'kind'> }[] = [];
  for (const p of products) {
    if (opts.limit !== undefined && placed.length >= opts.limit) break;
    const best = p.best;
    if (!best) continue;
    const s = coords.get(best.store.id);
    if (!s) continue;
    const gtin = p.gtin;
    placed.push({
      p,
      pin: {
        id: gtin,
        lat: s.lat,
        lng: s.lng,
        text: pricePinText(best.priceCents),
        label: `${p.title} · ${s.name}`,
        photoUrl: p.photoUrl,
        ...(opts.onSelect ? { onClick: () => opts.onSelect!(gtin) } : {}),
      },
    });
  }
  const min = Math.min(...placed.map(({ p }) => p.best!.priceCents));
  return placed.map(({ p, pin }) => ({
    ...pin,
    kind: opts.selectedGtin === p.gtin || p.best!.priceCents === min ? ('best' as const) : ('price' as const),
  }));
}

/** Pins de estabelecimento — 1 por loja (posição no ranking RN-10), sem pin de produto. */
export function establishmentPins(
  ranking: StoreRankDTO[] | undefined,
  opts: { selectedId?: number | null; onSelect?: (id: number) => void } = {},
): MapPin[] {
  return (ranking ?? [])
    .filter((r) => r.store.lat !== null && r.store.lng !== null)
    .map((r) => {
      const id = r.store.id;
      const selected = opts.selectedId === id;
      return {
        id,
        lat: r.store.lat ?? 0,
        lng: r.store.lng ?? 0,
        text: r.position ? String(r.position) : '·',
        kind: (selected || r.position === 1 ? 'best' : 'store') as MapPin['kind'],
        label: r.store.name,
        ...(opts.onSelect ? { onClick: () => opts.onSelect!(id) } : {}),
      };
    });
}

export function youPin(anchor: { lat: number; lng: number }): MapPin {
  return { id: 'you', lat: anchor.lat, lng: anchor.lng, text: '', kind: 'you', label: 'Você' };
}
