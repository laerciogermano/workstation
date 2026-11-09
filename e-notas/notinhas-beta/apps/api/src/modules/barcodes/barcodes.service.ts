import type {
  BarcodeOrigin,
  BarcodeRegistrationTallyDTO,
  LinkResultDTO,
  ProductBarcodeLinkDTO,
  SuggestionDTO,
} from '@notinhas/contracts';
import { classifyProduct, descriptionSimilarity, humanizeDescription } from '@notinhas/domain';
import type { Db, Queryable } from '../../shared/db.js';
import { withTx } from '../../shared/db.js';
import type { Owner } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { awardPoints } from '../points/points.service.js';
import type { EanSuggestPort } from './ean-suggest.port.js';
import type { ProductLookupPort } from './product-lookup.port.js';

async function itemDescription(db: Queryable, storeId: number, storeCode: string): Promise<string | null> {
  const { rows } = await db.query<{ description: string }>(
    'SELECT description FROM receipt_items WHERE store_id = $1 AND store_code = $2 ORDER BY id DESC LIMIT 1',
    [storeId, storeCode],
  );
  return rows[0]?.description ?? null;
}

/** Contagens por EAN + gtin principal (mais votos; empate = registro mais recente). */
export async function registrationTallies(
  db: Queryable,
  storeId: number,
  storeCode: string,
): Promise<{ primaryGtin: string | null; registrations: BarcodeRegistrationTallyDTO[] }> {
  const { rows } = await db.query<{ gtin: string; votes: string; last_at: Date }>(
    `SELECT gtin, count(*)::text AS votes, max(created_at) AS last_at
     FROM barcode_registrations
     WHERE store_id = $1 AND store_code = $2
     GROUP BY gtin
     ORDER BY count(*) DESC, max(created_at) DESC, gtin ASC`,
    [storeId, storeCode],
  );
  const primaryGtin = rows[0]?.gtin ?? null;
  return {
    primaryGtin,
    registrations: rows.map((r) => ({
      gtin: r.gtin,
      votes: Number(r.votes),
      primary: r.gtin === primaryGtin,
    })),
  };
}

/** Aplica o EAN mais votado em barcode_links (fonte do índice / v_price_observations). */
async function upsertPrimaryLink(
  tx: Queryable,
  input: {
    storeId: number;
    storeCode: string;
    gtin: string;
    origin: BarcodeOrigin;
    visitorId: number | null;
    userId: number | null;
  },
): Promise<void> {
  await tx.query(
    `INSERT INTO barcode_links (store_id, store_code, gtin, origin, linked_by_visitor_id, linked_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (store_id, store_code) DO UPDATE SET
       gtin = EXCLUDED.gtin,
       origin = EXCLUDED.origin,
       linked_by_visitor_id = EXCLUDED.linked_by_visitor_id,
       linked_by_user_id = EXCLUDED.linked_by_user_id,
       updated_at = now()`,
    [input.storeId, input.storeCode, input.gtin, input.origin, input.visitorId, input.userId],
  );
}

/** Origem do último voto do gtin vencedor (para gravar em barcode_links). */
async function latestOriginForGtin(
  tx: Queryable,
  storeId: number,
  storeCode: string,
  gtin: string,
): Promise<BarcodeOrigin> {
  const { rows } = await tx.query<{ origin: BarcodeOrigin }>(
    `SELECT origin FROM barcode_registrations
     WHERE store_id = $1 AND store_code = $2 AND gtin = $3
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [storeId, storeCode, gtin],
  );
  return rows[0]?.origin ?? 'manual';
}

/** Vínculos (loja, cód.) cujo EAN principal é este — ficha do produto / Alterar (REQ-067). */
export async function linksForGtin(db: Queryable, gtin: string): Promise<ProductBarcodeLinkDTO[]> {
  const { rows } = await db.query<{
    store_id: string;
    store_code: string;
    origin: string;
    store_name: string;
    description: string | null;
  }>(
    `SELECT bl.store_id, bl.store_code, bl.origin, s.display_name AS store_name,
            (SELECT ri.description FROM receipt_items ri
              WHERE ri.store_id = bl.store_id AND ri.store_code = bl.store_code
              ORDER BY ri.id DESC LIMIT 1) AS description
     FROM barcode_links bl
     JOIN stores s ON s.id = bl.store_id
     WHERE bl.gtin = $1
     ORDER BY bl.updated_at DESC, bl.id DESC
     LIMIT 50`,
    [gtin],
  );
  const out: ProductBarcodeLinkDTO[] = [];
  for (const r of rows) {
    const description = (r.description || '').trim() || r.store_code;
    const tallies = await registrationTallies(db, Number(r.store_id), r.store_code);
    const mine = tallies.registrations.find((t) => t.gtin === gtin);
    out.push({
      storeId: Number(r.store_id),
      storeCode: r.store_code,
      storeName: r.store_name,
      description,
      displayName: humanizeDescription(description),
      origin: (r.origin as BarcodeOrigin) || null,
      votes: mine?.votes ?? 0,
      registrations: tallies.registrations,
    });
  }
  return out;
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
 * US-01.10 · RN-12 — cada vínculo é um voto em barcode_registrations.
 * O EAN ativo (barcode_links) = mais repetido; empate → voto mais recente.
 * `replace` permanece no contrato (legado) mas não força sobrescrita.
 */
export async function linkBarcode(
  deps: { db: Db; productLookup: ProductLookupPort },
  input: { storeId: number; storeCode: string; gtin: string; origin: BarcodeOrigin; replace?: boolean; vocr?: string | null },
  owner: Owner | null,
): Promise<LinkResultDTO> {
  const { db } = deps;
  const desc = await itemDescription(db, input.storeId, input.storeCode);
  if (!desc) throw new AppError('NOT_FOUND', 'Esse item não está em nenhuma nota desta loja.');
  await ensureProduct(db, deps.productLookup, input.gtin, desc);

  const out = await withTx(db, async (tx) => {
    const before = await tx.query<{ gtin: string }>(
      'SELECT gtin FROM barcode_links WHERE store_id = $1 AND store_code = $2 FOR UPDATE',
      [input.storeId, input.storeCode],
    );
    const prevPrimary = before.rows[0]?.gtin ?? null;

    const vocr = input.vocr?.replace(/\D/g, '') || null;
    await tx.query(
      `INSERT INTO barcode_registrations (store_id, store_code, gtin, origin, vocr, linked_by_visitor_id, linked_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [input.storeId, input.storeCode, input.gtin, input.origin, vocr, owner?.visitorId ?? null, owner?.userId ?? null],
    );

    const tallies = await registrationTallies(tx, input.storeId, input.storeCode);
    const primaryGtin = tallies.primaryGtin;
    if (!primaryGtin) throw new AppError('INTERNAL', 'Falha ao calcular EAN principal.');

    const origin = await latestOriginForGtin(tx, input.storeId, input.storeCode, primaryGtin);
    await upsertPrimaryLink(tx, {
      storeId: input.storeId,
      storeCode: input.storeCode,
      gtin: primaryGtin,
      origin,
      visitorId: owner?.visitorId ?? null,
      userId: owner?.userId ?? null,
    });

    // Moderação informativa se o voto não é o principal (divergência comunitária).
    if (primaryGtin !== input.gtin) {
      await tx.query(
        `INSERT INTO moderation_flags (kind, store_id, store_code, current_gtin, proposed_gtin, summary)
         VALUES ('ean_divergent', $1, $2, $3, $4, $5)
         ON CONFLICT (kind, store_id, store_code, proposed_gtin) WHERE status = 'open' DO NOTHING`,
        [
          input.storeId,
          input.storeCode,
          primaryGtin,
          input.gtin,
          `voto: cód. ${input.storeCode} (${desc}) → ${input.gtin} (principal ${primaryGtin})`,
        ],
      );
    }

    const points = owner
      ? await awardPoints(
          tx,
          owner,
          'eanLink',
          `link:${input.storeId}:${input.storeCode}:${input.gtin}`,
          `EAN · ${humanizeDescription(desc)}`,
        )
      : 0;

    let status: LinkResultDTO['status'];
    if (!prevPrimary) status = 'linked';
    else if (prevPrimary !== primaryGtin) status = 'primary_changed';
    else status = 'registered';

    return { status, points, primaryGtin, registrations: tallies.registrations };
  });

  const p = await db.query<{ gtin: string; title: string; photo_url: string | null }>(
    'SELECT gtin, title, photo_url FROM products WHERE gtin = $1',
    [input.gtin],
  );
  const prod = p.rows[0];
  if (!prod) throw new AppError('NOT_FOUND');
  return {
    status: out.status,
    pointsAwarded: out.points,
    product: { gtin: prod.gtin, title: prod.title, photoUrl: prod.photo_url },
    primaryGtin: out.primaryGtin,
    registrations: out.registrations,
    vocr: input.vocr?.replace(/\D/g, '') || null,
  };
}

/**
 * REQ-039/043/044 — candidatos de EAN pela descrição:
 * 1) catálogo local (pg_trgm + Jaccard)
 * 2) ean-serp / SI5 (quando `EAN_SERP_URL` está configurado)
 * `q` opcional refine a busca (campo editável no sheet); default = descrição da DANFE.
 */
export async function suggestBarcodes(
  deps: { db: Db; eanSuggest: EanSuggestPort },
  storeId: number,
  storeCode: string,
  q?: string,
): Promise<SuggestionDTO[]> {
  const desc = await itemDescription(deps.db, storeId, storeCode);
  if (!desc) throw new AppError('NOT_FOUND');
  const query = (q?.trim() || desc).trim();
  const human = humanizeDescription(query);
  const { rows } = await deps.db.query<{ gtin: string; title: string; photo_url: string | null; sim: number }>(
    `SELECT p.gtin, p.title, p.photo_url, greatest(similarity(p.title, $1), similarity(p.title, $2)) AS sim
     FROM products p
     WHERE p.title % $1 OR p.title % $2
        OR p.gtin IN (SELECT bl.gtin FROM barcode_links bl JOIN receipt_items ri
                        ON ri.store_id = bl.store_id AND ri.store_code = bl.store_code
                      WHERE ri.description = $3)
        OR p.gtin IN (SELECT br.gtin FROM barcode_registrations br JOIN receipt_items ri
                        ON ri.store_id = br.store_id AND ri.store_code = br.store_code
                      WHERE ri.description = $3)
     ORDER BY sim DESC LIMIT 50`,
    [human, query, desc],
  );
  const local: SuggestionDTO[] = rows
    .map((r) => ({
      gtin: r.gtin,
      title: r.title,
      photoUrl: r.photo_url,
      score: Math.round(Math.max(r.sim, descriptionSimilarity(query, r.title)) * 100) / 100,
      source: 'catalogo' as const,
    }))
    .filter((s) => s.score >= 0.25);

  /** Mínimo 50 candidatos no sheet (REQ-066); SI5 até 100, depois corta. */
  const SUGGEST_LIMIT = 50;
  const remote = await deps.eanSuggest.byDescription(query, SUGGEST_LIMIT);

  const byGtin = new Map<string, SuggestionDTO>();
  for (const s of [...local, ...remote]) {
    const prev = byGtin.get(s.gtin);
    if (!prev || s.score > prev.score || (!prev.photoUrl && s.photoUrl)) {
      byGtin.set(s.gtin, {
        ...s,
        photoUrl: proxyPhotoUrl(s.photoUrl ?? prev?.photoUrl ?? null),
        title: s.title || prev?.title || s.gtin,
        score: Math.max(s.score, prev?.score ?? 0),
      });
    }
  }
  return [...byGtin.values()].sort((a, b) => b.score - a.score).slice(0, SUGGEST_LIMIT);
}

/** SI5 / Google / CDNs — devolve URL same-origin via proxy. */
function proxyPhotoUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/media/') || url.startsWith('/api/')) return url;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return null;
    return `/api/v1/imagens/proxy?u=${encodeURIComponent(url)}`;
  } catch {
    return null;
  }
}
