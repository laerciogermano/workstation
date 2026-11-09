import { cents, type PriceObservation } from '@notinhas/domain';
import type { Clock } from '../../shared/clock.js';
import type { Db } from '../../shared/db.js';

export interface StoreRow {
  id: number;
  name: string;
  legalName: string;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  receipts: number;
  items: number;
  withEan: number;
}

export interface ProductRow {
  gtin: string;
  title: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  ncm: string | null;
  photoUrl: string | null;
  sources: string[];
}

export interface IndexSnapshot {
  at: Date;
  observations: PriceObservation[];
  stores: Map<number, StoreRow>;
  products: Map<string, ProductRow>;
  /** quantas vezes o EAN aparece em notas (Mais comprados) */
  frequency: Map<string, number>;
}

/** Janela carregada em memória: 180 dias. Beta tem poucas lojas; acima de ~1M observações, mover RN-10/11 para SQL (ver docs/adr/0004). */
const LOAD_WINDOW_DAYS = 180;
const TTL_MS = 15_000;

/**
 * Snapshot do índice público (RN-06: só tabelas fiscais/catálogo, nada de pessoa).
 * Leitura barata com TTL; ingestão e vínculo chamam invalidate().
 */
export function createPriceIndex(db: Db, clock: Clock) {
  let cache: { snap: IndexSnapshot; expires: number } | null = null;
  let inflight: Promise<IndexSnapshot> | null = null;

  async function load(): Promise<IndexSnapshot> {
    const at = clock.now();
    const [obs, stores, products] = await Promise.all([
      db.query<{ gtin: string; store_id: number; price_cents: number; observed_at: Date }>(
        `SELECT gtin, store_id, price_cents, observed_at FROM v_price_observations
         WHERE observed_at > $1::timestamptz - make_interval(days => $2)`,
        [at, LOAD_WINDOW_DAYS],
      ),
      db.query<{
        id: number; display_name: string; legal_name: string; neighborhood: string | null; address: string | null;
        lat: number | null; lng: number | null; receipts: number; items: number; with_ean: number;
      }>(
        `SELECT s.id, s.display_name, s.legal_name, s.neighborhood, s.address, s.lat, s.lng,
                (SELECT count(*)::int FROM receipts r WHERE r.store_id = s.id) AS receipts,
                (SELECT count(DISTINCT ri.store_code)::int FROM receipt_items ri WHERE ri.store_id = s.id AND NOT ri.is_hidden) AS items,
                (SELECT count(*)::int FROM barcode_links bl WHERE bl.store_id = s.id) AS with_ean
         FROM stores s`,
      ),
      db.query<{
        gtin: string; title: string; brand: string | null; category: string; subcategory: string | null;
        ncm: string | null; photo_url: string | null; sources: string[];
      }>('SELECT gtin, title, brand, category, subcategory, ncm, photo_url, sources FROM products'),
    ]);
    const observations = obs.rows.map((o) => ({
      gtin: o.gtin,
      storeId: o.store_id,
      priceCents: cents(o.price_cents),
      observedAt: o.observed_at,
    }));
    const frequency = new Map<string, number>();
    for (const o of observations) frequency.set(o.gtin, (frequency.get(o.gtin) ?? 0) + 1);
    return {
      at,
      observations,
      frequency,
      stores: new Map(
        stores.rows.map((s) => [
          s.id,
          { id: s.id, name: s.display_name, legalName: s.legal_name, neighborhood: s.neighborhood, address: s.address, lat: s.lat, lng: s.lng, receipts: s.receipts, items: s.items, withEan: s.with_ean },
        ]),
      ),
      products: new Map(
        products.rows.map((p) => [
          p.gtin,
          { gtin: p.gtin, title: p.title, brand: p.brand, category: p.category, subcategory: p.subcategory, ncm: p.ncm, photoUrl: p.photo_url, sources: p.sources },
        ]),
      ),
    };
  }

  return {
    async get(): Promise<IndexSnapshot> {
      if (cache && cache.expires > Date.now()) return cache.snap;
      inflight ??= load()
        .then((snap) => {
          cache = { snap, expires: Date.now() + TTL_MS };
          return snap;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
    invalidate(): void {
      cache = null;
    },
  };
}
export type PriceIndex = ReturnType<typeof createPriceIndex>;
