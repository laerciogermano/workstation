import type {
  ComparisonRowDTO,
  HomeDTO,
  OfferDTO,
  ProductCardDTO,
  ProductDetailDTO,
  SearchDTO,
  StoreRankDTO,
  StoreRefDTO,
  StoreVitrineDTO,
  UnlinkedItemDTO,
} from '@notinhas/contracts';
import {
  CATEGORIES,
  DEFAULT_ANCHOR,
  bestOffer,
  haversineKm,
  highlightOf,
  humanizeDescription,
  isStale,
  isValidGtin,
  latestByStore,
  median,
  rankStores,
  HOT_WINDOW_DAYS,
  type Coordinates,
  type PriceObservation,
} from '@notinhas/domain';
import type { Db } from '../../shared/db.js';
import { AppError } from '../../shared/http/problem.js';
import type { IndexSnapshot, StoreRow } from './price-index.js';

export const anchorOf = (q: { lat?: number | undefined; lng?: number | undefined }): Coordinates =>
  q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : DEFAULT_ANCHOR;

const storeRef = (s: StoreRow | undefined, id: number): StoreRefDTO => ({ id, name: s?.name ?? `Loja ${id}`, neighborhood: s?.neighborhood ?? null });

export function distanceTo(s: StoreRow | undefined, anchor: Coordinates): number | null {
  return s && s.lat !== null && s.lng !== null ? Math.round(haversineKm(anchor, { lat: s.lat, lng: s.lng }) * 100) / 100 : null;
}

function offer(snap: IndexSnapshot, o: PriceObservation, anchor: Coordinates): OfferDTO {
  const s = snap.stores.get(o.storeId);
  return {
    store: storeRef(s, o.storeId),
    priceCents: o.priceCents,
    observedAt: o.observedAt.toISOString(),
    distanceKm: distanceTo(s, anchor),
    isStale: isStale(o.observedAt, snap.at),
  };
}

export function productCard(snap: IndexSnapshot, gtin: string, anchor: Coordinates): ProductCardDTO | null {
  const p = snap.products.get(gtin);
  if (!p) return null;
  const best = bestOffer(snap.observations, gtin, snap.at);
  const h = highlightOf(snap.observations, gtin, snap.at);
  return {
    gtin,
    title: p.title,
    brand: p.brand,
    category: p.category,
    photoUrl: p.photoUrl,
    best: best ? offer(snap, best, anchor) : null,
    highlight: h ? { medianCents: h.medianCents, ratio: h.ratio } : null,
  };
}

/** Só produtos com EAN e ao menos uma observação aparecem nas vitrines (REQ-045). */
function pricedCards(snap: IndexSnapshot, anchor: Coordinates): ProductCardDTO[] {
  const gtins = [...new Set(snap.observations.map((o) => o.gtin))];
  return gtins.map((g) => productCard(snap, g, anchor)).filter((c): c is ProductCardDTO => !!c?.best);
}

/** T-10 · REQ-056: Promoções → Mais comprados → categorias */
export function home(snap: IndexSnapshot, anchor: Coordinates): HomeDTO {
  const cards = pricedCards(snap, anchor);
  const promotions = [
    ...cards.filter((c) => c.highlight).sort((a, b) => (a.highlight?.ratio ?? 0) - (b.highlight?.ratio ?? 0)),
    ...cards.filter((c) => !c.highlight && !c.best?.isStale).sort((a, b) => (a.best?.priceCents ?? 0) - (b.best?.priceCents ?? 0)),
  ].slice(0, 24);
  const mostBought = [...cards].sort((a, b) => (snap.frequency.get(b.gtin) ?? 0) - (snap.frequency.get(a.gtin) ?? 0)).slice(0, 24);
  const categories = CATEGORIES.map((c) => ({ id: c.id, name: c.short, products: cards.filter((p) => p.category === c.id) })).filter(
    (c) => c.products.length > 0,
  );
  return {
    promotions,
    mostBought,
    categories,
    stats: { stores: snap.stores.size, receipts: [...snap.stores.values()].reduce((a, s) => a + s.receipts, 0), products: cards.length },
  };
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** T-11 / T-72 — nome, marca ou EAN; itens sem EAN à parte com confiança menor (Q6). */
export async function search(
  db: Db,
  snap: IndexSnapshot,
  q: { q: string; categoria?: string | undefined; ordem: 'preco' | 'distancia' },
  anchor: Coordinates,
): Promise<SearchDTO> {
  const term = q.q.trim();
  const digits = /^\d{8,14}$/.test(term) ? term : null;
  let cards = pricedCards(snap, anchor);
  if (q.categoria) cards = cards.filter((c) => c.category === q.categoria);
  if (digits) cards = cards.filter((c) => c.gtin === digits);
  else if (term) {
    const words = fold(term).split(/\s+/).filter(Boolean);
    cards = cards.filter((c) => {
      const hay = fold(`${c.title} ${c.brand ?? ''} ${c.gtin}`);
      return words.every((w) => hay.includes(w));
    });
  }
  cards.sort((a, b) =>
    q.ordem === 'distancia'
      ? (a.best?.distanceKm ?? 999) - (b.best?.distanceKm ?? 999)
      : (a.best?.priceCents ?? 0) - (b.best?.priceCents ?? 0),
  );

  let unlinked: UnlinkedItemDTO[] = [];
  if (term && !digits && term.length >= 3) {
    const { rows } = await db.query<{ store_id: number; store_code: string; description: string; price_cents: number; observed_at: Date }>(
      `SELECT DISTINCT ON (ri.store_id, ri.store_code) ri.store_id, ri.store_code, ri.description,
              ri.unit_price_cents AS price_cents, coalesce(r.issued_at, r.created_at) AS observed_at
       FROM receipt_items ri JOIN receipts r ON r.id = ri.receipt_id
       LEFT JOIN barcode_links bl ON bl.store_id = ri.store_id AND bl.store_code = ri.store_code
       WHERE bl.id IS NULL AND NOT ri.is_hidden AND (ri.description ILIKE '%' || $1 || '%' OR ri.description % $1)
       ORDER BY ri.store_id, ri.store_code, observed_at DESC
       LIMIT 20`,
      [term.toUpperCase()],
    );
    unlinked = rows.map((r) => ({
      store: storeRef(snap.stores.get(r.store_id), r.store_id),
      storeCode: r.store_code,
      description: r.description,
      displayName: humanizeDescription(r.description),
      priceCents: r.price_cents,
      observedAt: r.observed_at.toISOString(),
    }));
  }
  return { q: term, gtinQuery: digits ? { gtin: digits, valid: isValidGtin(digits) } : null, products: cards, unlinked };
}

/** T-14 (+T-12/T-13/T-30) — ficha canônica, comparação por loja e histórico. */
export function productDetail(snap: IndexSnapshot, gtin: string, anchor: Coordinates): ProductDetailDTO {
  const p = snap.products.get(gtin);
  if (!p) throw new AppError('NOT_FOUND', 'Ainda não temos esse produto.');
  const best = bestOffer(snap.observations, gtin, snap.at);
  const latest = latestByStore(snap.observations, gtin, snap.at);
  const hot = latestByStore(snap.observations, gtin, snap.at, HOT_WINDOW_DAYS);
  const h = highlightOf(snap.observations, gtin, snap.at);
  const comparison: ComparisonRowDTO[] = latest.map((o) => {
    const s = snap.stores.get(o.storeId);
    return { ...offer(snap, o, anchor), lat: s?.lat ?? null, lng: s?.lng ?? null, isBest: best?.storeId === o.storeId && best.priceCents === o.priceCents };
  });
  const history = snap.observations
    .filter((o) => o.gtin === gtin)
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .map((o) => offer(snap, o, anchor));
  return {
    product: { ...p },
    best: best ? offer(snap, best, anchor) : null,
    medianCents: hot.length ? median(hot.map((o) => o.priceCents)) : null,
    highlight: h ? { medianCents: h.medianCents, ratio: h.ratio } : null,
    comparison,
    history,
    links: [], // preenchido na rota com barcode_links (REQ-067)
  };
}

/** T-31 · RN-10 — ranking no raio (lojas sem coordenada ficam no fim, sem distância). */
export function storeRanking(snap: IndexSnapshot, anchor: Coordinates, radiusKm: number): StoreRankDTO[] {
  const inRadius = [...snap.stores.values()].filter((s) => {
    const d = distanceTo(s, anchor);
    return d === null || d <= radiusKm;
  });
  const ranks = rankStores(snap.observations, inRadius.map((s) => s.id), snap.at);
  return ranks.map((r) => {
    const s = snap.stores.get(r.storeId);
    return {
      store: { ...storeRef(s, r.storeId), address: s?.address ?? null, lat: s?.lat ?? null, lng: s?.lng ?? null },
      distanceKm: distanceTo(s, anchor),
      index: r.index,
      position: r.position,
      of: r.of,
      comparableProducts: r.comparableProducts,
      progress: { receipts: s?.receipts ?? 0, items: s?.items ?? 0, withEan: s?.withEan ?? 0 },
    };
  });
}

/** T-33 / T-34 — vitrine: com EAN (preço desta loja) e sem EAN (descrição crua da DANFE). */
export async function storeVitrine(
  db: Db,
  snap: IndexSnapshot,
  storeId: number,
  anchor: Coordinates,
  q: string,
): Promise<StoreVitrineDTO> {
  const s = snap.stores.get(storeId);
  if (!s) throw new AppError('NOT_FOUND', 'Loja não encontrada.');
  const rank = storeRanking(snap, anchor, 10_000).find((r) => r.store.id === storeId);
  if (!rank) throw new AppError('NOT_FOUND');
  const term = fold(q);
  const here = new Map<string, PriceObservation>();
  for (const o of snap.observations) {
    if (o.storeId !== storeId) continue;
    const cur = here.get(o.gtin);
    if (!cur || o.observedAt > cur.observedAt) here.set(o.gtin, o);
  }
  const withEan = [...here.values()]
    .map((o) => {
      const card = productCard(snap, o.gtin, anchor);
      return card ? { ...card, here: { priceCents: o.priceCents, observedAt: o.observedAt.toISOString() } } : null;
    })
    .filter((c): c is NonNullable<typeof c> => !!c && (!term || fold(`${c.title} ${c.brand ?? ''}`).includes(term)))
    .sort((a, b) => b.here.observedAt.localeCompare(a.here.observedAt));

  const { rows } = await db.query<{ store_code: string; description: string; price_cents: number; observed_at: Date }>(
    `SELECT DISTINCT ON (ri.store_code) ri.store_code, ri.description, ri.unit_price_cents AS price_cents,
            coalesce(r.issued_at, r.created_at) AS observed_at
     FROM receipt_items ri JOIN receipts r ON r.id = ri.receipt_id
     LEFT JOIN barcode_links bl ON bl.store_id = ri.store_id AND bl.store_code = ri.store_code
     WHERE ri.store_id = $1 AND bl.id IS NULL AND NOT ri.is_hidden
       AND ($2 = '' OR ri.description ILIKE '%' || $2 || '%')
     ORDER BY ri.store_code, observed_at DESC
     LIMIT 300`,
    [storeId, q.toUpperCase()],
  );
  const withoutEan = rows
    .map((r) => ({
      store: storeRef(s, storeId),
      storeCode: r.store_code,
      description: r.description,
      displayName: humanizeDescription(r.description),
      priceCents: r.price_cents,
      observedAt: r.observed_at.toISOString(),
    }))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  return { rank, withEan, withoutEan };
}
