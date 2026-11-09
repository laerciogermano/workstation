import { Router } from 'express';
import { z } from 'zod';
import { GtinSchema, LinkBarcodeSchema } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { maybeOwnerOf } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { linkBarcode, suggestBarcodes } from './barcodes.service.js';
import { photoTallies, registerPhotoVote } from './photos.service.js';
import { isAllowedPhotoUrl } from './photo-url.js';

const SuggestQuery = z.object({
  storeId: z.coerce.number().int().positive(),
  storeCode: z.string().min(1).max(60),
  /** Texto livre para refinar a busca SI5/catálogo (default = descrição da DANFE). */
  q: z.string().max(200).optional(),
});

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

async function photoCandidates(deps: Deps, gtin: string) {
  const { rows } = await deps.db.query<{ photo_url: string | null; title: string | null }>(
    'SELECT photo_url, title FROM products WHERE gtin = $1',
    [gtin],
  );
  if (!rows[0]) throw new AppError('NOT_FOUND');
  const info = await deps.productLookup.byGtin(gtin);
  const descricao = (rows[0].title || info?.title || '').trim();
  const external = await deps.eanSuggest.photosByGtin(gtin, { descricao });
  const out: { url: string; source: string }[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined, source: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ url, source });
  };
  push(rows[0].photo_url, 'atual');
  for (const u of info?.photoUrls ?? []) push(u, 'Open Food Facts');
  for (const s of external) push(s.url, s.source);
  return { current: rows[0].photo_url, candidates: out, allowed: seen };
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

/** T-24 — candidatas de foto pelo EAN; cada POST é um voto; products.photo_url = mais votada. */
export function productPhotoRoutes(deps: Deps): Router {
  const r = Router({ mergeParams: true });

  r.get('/', async (req, res) => {
    const gtin = parse(GtinSchema, (req.params as { gtin: string }).gtin);
    const { current, candidates } = await photoCandidates(deps, gtin);
    const tallies = await photoTallies(deps.db, gtin);
    const byUrl = new Map(tallies.registrations.map((t) => [t.url, t]));
    res.json({
      current: tallies.primaryUrl ?? current,
      candidates: candidates.map((c) => {
        const t = byUrl.get(c.url);
        return {
          url: c.url,
          source: c.source,
          votes: t?.votes ?? 0,
          primary: t?.primary ?? c.url === (tallies.primaryUrl ?? current),
        };
      }),
      registrations: tallies.registrations,
    });
  });

  r.post('/', async (req, res) => {
    const gtin = parse(GtinSchema, (req.params as { gtin: string }).gtin);
    const body = parse(z.object({ url: z.string().min(1).max(8000), source: z.string().max(40).optional() }), req.body);
    const url = unwrapPhotoUrl(body.url);
    if (!isAllowedPhotoUrl(url)) throw new AppError('VALIDATION_FAILED', 'Foto fora da lista de candidatas.');
    const { allowed } = await photoCandidates(deps, gtin);
    // aceita URL da lista atual OU https público (lista Google muda entre GET e POST)
    if (!allowed.has(url) && !isAllowedPhotoUrl(url)) {
      throw new AppError('VALIDATION_FAILED', 'Foto fora da lista de candidatas.');
    }
    res.json(await registerPhotoVote(deps, { gtin, url, source: body.source ?? 'picker' }, maybeOwnerOf(req)));
  });

  return r;
}
