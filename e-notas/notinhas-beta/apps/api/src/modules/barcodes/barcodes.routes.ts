import { Router } from 'express';
import { z } from 'zod';
import { GtinSchema, LinkBarcodeSchema } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { maybeOwnerOf } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { linkBarcode, suggestBarcodes } from './barcodes.service.js';

const SuggestQuery = z.object({
  storeId: z.coerce.number().int().positive(),
  storeCode: z.string().min(1).max(60),
  /** Texto livre para refinar a busca SI5/catálogo (default = descrição da DANFE). */
  q: z.string().max(200).optional(),
});

const PHOTO_HOSTS = [/(^|\.)si5\.com\.br$/i, /(^|\.)openfoodfacts\.org$/i, /(^|\.)openfoodfacts\.net$/i];

function isAllowedPhotoUrl(url: string): boolean {
  if (url.startsWith('/media/')) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && PHOTO_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

/** Desfaz proxy same-origin → URL https original. */
function unwrapPhotoUrl(url: string): string {
  if (url.startsWith('/api/v1/imagens/proxy?')) {
    try {
      return new URL(url, 'http://local').searchParams.get('u') || url;
    } catch {
      return url;
    }
  }
  return url;
}

export function barcodesRoutes(deps: Deps): Router {
  const r = Router();

  // T-23 · T-34 — vincular (scan · sugestão · manual)
  r.post('/', async (req, res) => {
    const input = parse(LinkBarcodeSchema, req.body);
    res.json(await linkBarcode(deps, input, maybeOwnerOf(req)));
  });

  r.get('/sugestoes', async (req, res) => {
    const q = parse(SuggestQuery, req.query);
    res.json(await suggestBarcodes(deps, q.storeId, q.storeCode, q.q));
  });

  return r;
}

/** T-24 — candidatas de foto pelo EAN; a escolhida vira a foto da ficha para todas as lojas. */
export function productPhotoRoutes(deps: Deps): Router {
  const r = Router({ mergeParams: true });

  r.get('/', async (req, res) => {
    const gtin = parse(GtinSchema, (req.params as { gtin: string }).gtin);
    const { rows } = await deps.db.query<{ photo_url: string | null }>('SELECT photo_url FROM products WHERE gtin = $1', [gtin]);
    if (!rows[0]) throw new AppError('NOT_FOUND');
    const info = await deps.productLookup.byGtin(gtin);
    const si5 = await deps.eanSuggest.photosByGtin(gtin);
    const out: { url: string; source: string }[] = [];
    const seen = new Set<string>();
    const push = (url: string | null | undefined, source: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      out.push({ url, source });
    };
    push(rows[0].photo_url, 'atual');
    for (const u of info?.photoUrls ?? []) push(u, 'Open Food Facts');
    for (const s of si5) push(s.url, s.source);
    res.json({ current: rows[0].photo_url, candidates: out });
  });

  r.post('/', async (req, res) => {
    const gtin = parse(GtinSchema, (req.params as { gtin: string }).gtin);
    const raw = parse(z.object({ url: z.string().min(1).max(800) }), req.body).url;
    const url = unwrapPhotoUrl(raw);
    if (!isAllowedPhotoUrl(url)) throw new AppError('VALIDATION_FAILED', 'Foto fora da lista de candidatas.');
    const info = await deps.productLookup.byGtin(gtin);
    const si5 = await deps.eanSuggest.photosByGtin(gtin);
    const current = await deps.db.query<{ photo_url: string | null }>('SELECT photo_url FROM products WHERE gtin = $1', [gtin]);
    const allowed = new Set(
      [current.rows[0]?.photo_url, ...(info?.photoUrls ?? []), ...si5.map((s) => s.url)].filter((u): u is string => !!u),
    );
    // aceita URL allowlist mesmo se a lista SI5 mudou entre GET e POST
    if (!allowed.has(url) && !isAllowedPhotoUrl(url)) {
      throw new AppError('VALIDATION_FAILED', 'Foto fora da lista de candidatas.');
    }
    await deps.db.query('UPDATE products SET photo_url = $2 WHERE gtin = $1', [gtin, url]);
    res.json({ ok: true });
  });

  return r;
}
