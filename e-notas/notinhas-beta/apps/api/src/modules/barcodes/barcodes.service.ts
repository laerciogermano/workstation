import type { BarcodeOrigin, LinkResultDTO, SuggestionDTO } from '@notinhas/contracts';
import { classifyProduct, descriptionSimilarity, humanizeDescription } from '@notinhas/domain';
import type { Db, Queryable } from '../../shared/db.js';
import { withTx } from '../../shared/db.js';
import type { Owner } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { awardPoints } from '../points/points.service.js';
import type { ProductLookupPort } from './product-lookup.port.js';

async function itemDescription(db: Queryable, storeId: number, storeCode: string): Promise<string | null> {
  const { rows } = await db.query<{ description: string }>(
    'SELECT description FROM receipt_items WHERE store_id = $1 AND store_code = $2 ORDER BY id DESC LIMIT 1',
    [storeId, storeCode],
  );
  return rows[0]?.description ?? null;
}

/** Garante a ficha canônica do EAN (REQ-047). Rede fora de transação. */
export async function ensureProduct(db: Db, lookup: ProductLookupPort, gtin: string, fallbackText: string): Promise<void> {
  const has = await db.query('SELECT 1 FROM products WHERE gtin = $1', [gtin]);
  if (has.rowCount) return;
  const info = await lookup.byGtin(gtin);
  const title = info?.title ?? humanizeDescription(fallbackText);
  const { category, subcategory } = classifyProduct(`${title} ${fallbackText} ${info?.categoriesHint ?? ''}`);
  await db.query(
    `INSERT INTO products (gtin, title, brand, category, subcategory, photo_url, sources, enriched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (gtin) DO NOTHING`,
    [gtin, title, info?.brand ?? null, category, subcategory, info?.photoUrls[0] ?? null, info ? ['Open Food Facts'] : ['DANFE'], info ? new Date() : null],
  );
}

/**
 * US-01.10 · RN-12 · Q2 — UPSERT em (loja, cód. interno).
 * Primeiro vínculo vale; divergência posterior vira pendência de moderação (não sobrescreve).
 */
export async function linkBarcode(
  deps: { db: Db; productLookup: ProductLookupPort },
  input: { storeId: number; storeCode: string; gtin: string; origin: BarcodeOrigin },
  owner: Owner | null,
): Promise<LinkResultDTO> {
  const { db } = deps;
  const desc = await itemDescription(db, input.storeId, input.storeCode);
  if (!desc) throw new AppError('NOT_FOUND', 'Esse item não está em nenhuma nota desta loja.');
  await ensureProduct(db, deps.productLookup, input.gtin, desc);

  const out = await withTx(db, async (tx) => {
    const cur = await tx.query<{ gtin: string }>(
      'SELECT gtin FROM barcode_links WHERE store_id = $1 AND store_code = $2 FOR UPDATE',
      [input.storeId, input.storeCode],
    );
    const existing = cur.rows[0];
    if (!existing) {
      await tx.query(
        `INSERT INTO barcode_links (store_id, store_code, gtin, origin, linked_by_visitor_id, linked_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.storeId, input.storeCode, input.gtin, input.origin, owner?.visitorId ?? null, owner?.userId ?? null],
      );
      const points = owner
        ? await awardPoints(tx, owner, 'eanLink', `link:${input.storeId}:${input.storeCode}`, `EAN · ${humanizeDescription(desc)}`)
        : 0;
      return { status: 'linked' as const, points };
    }
    if (existing.gtin === input.gtin) return { status: 'unchanged' as const, points: 0 };
    await tx.query(
      `INSERT INTO moderation_flags (kind, store_id, store_code, current_gtin, proposed_gtin, summary)
       VALUES ('ean_divergent', $1, $2, $3, $4, $5)
       ON CONFLICT (kind, store_id, store_code, proposed_gtin) WHERE status = 'open' DO NOTHING`,
      [input.storeId, input.storeCode, existing.gtin, input.gtin, `cód. ${input.storeCode} (${desc}) → ${existing.gtin} vs ${input.gtin}`],
    );
    return { status: 'flagged' as const, points: 0 };
  });

  const p = await db.query<{ gtin: string; title: string; photo_url: string | null }>(
    'SELECT gtin, title, photo_url FROM products WHERE gtin = $1',
    [input.gtin],
  );
  const prod = p.rows[0];
  if (!prod) throw new AppError('NOT_FOUND');
  return { status: out.status, pointsAwarded: out.points, product: { gtin: prod.gtin, title: prod.title, photoUrl: prod.photo_url } };
}

/** REQ-039/043: candidatos de EAN pela descrição da DANFE (catálogo local, pg_trgm + Jaccard). */
export async function suggestBarcodes(db: Db, storeId: number, storeCode: string): Promise<SuggestionDTO[]> {
  const desc = await itemDescription(db, storeId, storeCode);
  if (!desc) throw new AppError('NOT_FOUND');
  const human = humanizeDescription(desc);
  const { rows } = await db.query<{ gtin: string; title: string; photo_url: string | null; sim: number }>(
    `SELECT p.gtin, p.title, p.photo_url, greatest(similarity(p.title, $1), similarity(p.title, $2)) AS sim
     FROM products p
     WHERE p.title % $1 OR p.title % $2
        OR p.gtin IN (SELECT bl.gtin FROM barcode_links bl JOIN receipt_items ri
                        ON ri.store_id = bl.store_id AND ri.store_code = bl.store_code
                      WHERE ri.description = $2)
     ORDER BY sim DESC LIMIT 12`,
    [human, desc],
  );
  return rows
    .map((r) => ({
      gtin: r.gtin,
      title: r.title,
      photoUrl: r.photo_url,
      score: Math.round(Math.max(r.sim, descriptionSimilarity(desc, r.title)) * 100) / 100,
      source: 'catalogo' as const,
    }))
    .filter((s) => s.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
