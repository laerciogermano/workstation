import { Router } from 'express';
import { z } from 'zod';
import { GtinSchema, LinkBarcodeSchema } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { maybeOwnerOf } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { linkBarcode, suggestBarcodes } from './barcodes.service.js';

const SuggestQuery = z.object({ storeId: z.coerce.number().int().positive(), storeCode: z.string().min(1).max(60) });

export function barcodesRoutes(deps: Deps): Router {
  const r = Router();

  // T-23 · T-34 — vincular (scan · sugestão · manual)
  r.post('/', async (req, res) => {
    const input = parse(LinkBarcodeSchema, req.body);
    res.json(await linkBarcode(deps, input, maybeOwnerOf(req)));
  });

  r.get('/sugestoes', async (req, res) => {
    const q = parse(SuggestQuery, req.query);
    res.json(await suggestBarcodes(deps.db, q.storeId, q.storeCode));
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
    const candidates = [...new Set([rows[0].photo_url, ...(info?.photoUrls ?? [])].filter((u): u is string => !!u))];
    res.json({ current: rows[0].photo_url, candidates: candidates.map((url) => ({ url, source: url === rows[0]?.photo_url ? 'atual' : 'Open Food Facts' })) });
  });

  r.post('/', async (req, res) => {
    const gtin = parse(GtinSchema, (req.params as { gtin: string }).gtin);
    const { url } = parse(z.object({ url: z.url().startsWith('https://') }), req.body);
    const info = await deps.productLookup.byGtin(gtin);
    const current = await deps.db.query<{ photo_url: string | null }>('SELECT photo_url FROM products WHERE gtin = $1', [gtin]);
    const allowed = new Set([current.rows[0]?.photo_url, ...(info?.photoUrls ?? [])]);
    if (!allowed.has(url)) throw new AppError('VALIDATION_FAILED', 'Foto fora da lista de candidatas.');
    await deps.db.query('UPDATE products SET photo_url = $2 WHERE gtin = $1', [gtin, url]);
    res.json({ ok: true });
  });

  return r;
}
