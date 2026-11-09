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
 * Micro-offset em torno da loja (~12–20 m) para pins no mesmo ponto não se empilharem.
 * Um único produto fica no ponto exato; vários formam um anel curto.
 * Antes → depois: jitter largo do protótipo (~120 m) → sem offset → este anel curto.
 */
export function nearStore(lat: number, lng: number, indexAmongStore: number, totalAtStore: number): { lat: number; lng: number } {
  if (totalAtStore <= 1 || indexAmongStore < 0) return { lat, lng };
  const radiusDeg = 0.00014; // ~15 m
  const angle = (2 * Math.PI * indexAmongStore) / totalAtStore - Math.PI / 2;
  const cosLat = Math.cos((lat * Math.PI) / 180) || 1;
  return {
    lat: lat + radiusDeg * Math.sin(angle),
    lng: lng + (radiusDeg * Math.cos(angle)) / cosLat,
  };
}

/**
 * Pins de produto (preço) — âncora = lat/lng da loja do melhor preço;
 * micro-anel se houver mais de um produto na mesma loja.
 */
export function productPricePins(
  products: ProductCardDTO[],
  ranking: StoreRankDTO[] | undefined,
  opts: { selectedGtin?: string | null; onSelect?: (gtin: string) => void; limit?: number } = {},
): MapPin[] {
  const coords = coordsByStore(ranking);
  type Row = { p: ProductCardDTO; storeId: number; lat: number; lng: number; name: string };
  const candidates: Row[] = [];
  for (const p of products) {
    if (opts.limit !== undefined && candidates.length >= opts.limit) break;
    const best = p.best;
    if (!best) continue;
    const s = coords.get(best.store.id);
    if (!s) continue;
    candidates.push({ p, storeId: best.store.id, lat: s.lat, lng: s.lng, name: s.name });
  }

  const countByStore = new Map<number, number>();
  const indexByStore = new Map<number, number>();
  for (const c of candidates) countByStore.set(c.storeId, (countByStore.get(c.storeId) ?? 0) + 1);

  const placed: { p: ProductCardDTO; pin: Omit<MapPin, 'kind'> }[] = [];
  for (const c of candidates) {
    const total = countByStore.get(c.storeId) ?? 1;
    const idx = indexByStore.get(c.storeId) ?? 0;
    indexByStore.set(c.storeId, idx + 1);
    const at = nearStore(c.lat, c.lng, idx, total);
    const gtin = c.p.gtin;
    placed.push({
      p: c.p,
      pin: {
        id: gtin,
        lat: at.lat,
        lng: at.lng,
        text: pricePinText(c.p.best!.priceCents),
        label: `${c.p.title} · ${c.name}`,
        photoUrl: c.p.photoUrl,
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
