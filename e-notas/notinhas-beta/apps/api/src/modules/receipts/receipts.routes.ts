import { Router } from 'express';
import { GeoQuerySchema, IngestReceiptSchema, type QuoteDTO } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { maybeOwnerOf, ownerOf, ownerSql } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { anchorOf } from '../catalog/catalog.service.js';
import { toQuoteDto } from '../catalog/quote-dto.js';
import { pointsAndCredits } from '../identity/identity.service.js';
import { ingestReceipt } from './ingest-receipt.js';
import { myReceipts, receiptDto, receiptIdByPublicId } from './receipts.repository.js';

export function receiptsRoutes(deps: Deps): Router {
  const { db } = deps;
  const r = Router();

  // T-20/T-21 → T-25 → T-22 | T-26 | T-27
  r.post('/', async (req, res) => {
    const { url } = parse(IngestReceiptSchema, req.body);
    const result = await ingestReceipt(deps, url, maybeOwnerOf(req));
    res.status(result.status === 'created' ? 201 : 200).json(result);
  });

  // T-50 — histórico pessoal (fingerprint ou conta; só o titular — RN-14)
  r.get('/minhas', async (req, res) => {
    res.json(await myReceipts(deps.db, ownerOf(req)));
  });

  // T-55 / T-22 — detalhe + cotação dos itens com EAN (mesmo T-41/T-42 das listas)
  r.get('/:id', async (req, res) => {
    const owner = ownerOf(req);
    const id = await receiptIdByPublicId(db, req.params.id, owner);
    const dto = id ? await receiptDto(db, id) : null;
    if (!dto) throw new AppError('NOT_FOUND');

    const basket = new Map<string, number>();
    for (const it of dto.items) {
      if (!it.gtin) continue;
      basket.set(it.gtin, (basket.get(it.gtin) ?? 0) + it.quantity);
    }
    const items = [...basket.entries()].map(([gtin, quantity]) => ({ gtin, quantity }));

    let { credits } = await pointsAndCredits(db, owner);
    let quote: QuoteDTO | null = null;
    if (items.length) {
      const ref = `receipt:${dto.id}:${deps.clock.now().toISOString().slice(0, 10)}`;
      const o = ownerSql(owner, 'ue', 2);
      const used = await db.query(`SELECT 1 FROM usage_events ue WHERE ue.ref = $1 AND ${o.sql}`, [ref, o.param]);
      if (used.rowCount || credits > 0) {
        if (!used.rowCount) {
          await db.query(`INSERT INTO usage_events (visitor_id, user_id, kind, ref) VALUES ($1, $2, 'quote', $3)`, [
            owner.visitorId,
            owner.userId,
            ref,
          ]);
          credits -= 1;
        }
        const anchor = anchorOf(parse(GeoQuerySchema, req.query));
        quote = toQuoteDto(await deps.index.get(), items, anchor);
      }
    }

    res.json({ ...dto, quote, credits });
  });

  return r;
}
