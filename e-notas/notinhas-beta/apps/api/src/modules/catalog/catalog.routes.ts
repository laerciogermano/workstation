import { Router } from 'express';
import { z } from 'zod';
import { CATEGORIES } from '@notinhas/domain';
import { GeoQuerySchema, GtinSchema, SearchQuerySchema, VitrineQuerySchema } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { parse } from '../../shared/http/validate.js';
import { productPhotoRoutes } from '../barcodes/barcodes.routes.js';
import { anchorOf, home, productDetail, search, storeRanking, storeVitrine } from './catalog.service.js';

/** Rotas públicas do índice — nunca expõem pessoa (RN-06). Cache curto no edge/navegador. */
export function catalogRoutes(deps: Deps): Router {
  const r = Router();
  const cache = 'public, max-age=30, stale-while-revalidate=120';

  r.get('/categorias', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=3600').json(CATEGORIES.map((c) => ({ id: c.id, name: c.short, icon: c.icon })));
  });

  r.get('/produtos/home', async (req, res) => {
    const q = parse(GeoQuerySchema, req.query);
    res.set('Cache-Control', cache).json(home(await deps.index.get(), anchorOf(q)));
  });

  r.get('/produtos/busca', async (req, res) => {
    const q = parse(SearchQuerySchema, req.query);
    res.set('Cache-Control', cache).json(await search(deps.db, await deps.index.get(), q, anchorOf(q)));
  });

  r.get('/produtos/:gtin', async (req, res) => {
    const gtin = parse(GtinSchema, req.params.gtin);
    const q = parse(GeoQuerySchema, req.query);
    res.set('Cache-Control', cache).json(productDetail(await deps.index.get(), gtin, anchorOf(q)));
  });

  r.use('/produtos/:gtin/fotos', productPhotoRoutes(deps));

  r.get('/lojas/ranking', async (req, res) => {
    const q = parse(GeoQuerySchema, req.query);
    res.set('Cache-Control', cache).json(storeRanking(await deps.index.get(), anchorOf(q), q.raioKm));
  });

  r.get('/lojas/:id', async (req, res) => {
    const id = parse(z.coerce.number().int().positive(), req.params.id);
    const q = parse(GeoQuerySchema.extend(VitrineQuerySchema.shape), req.query);
    res.set('Cache-Control', cache).json(await storeVitrine(deps.db, await deps.index.get(), id, anchorOf(q), q.q));
  });

  return r;
}
