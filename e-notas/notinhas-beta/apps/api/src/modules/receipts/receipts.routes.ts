import { Router } from 'express';
import { IngestReceiptSchema } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { maybeOwnerOf, ownerOf } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { ingestReceipt } from './ingest-receipt.js';
import { myReceipts, receiptDto, receiptIdByPublicId } from './receipts.repository.js';

export function receiptsRoutes(deps: Deps): Router {
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

  // T-55 / T-22 — detalhe só para quem tem a nota no histórico
  r.get('/:id', async (req, res) => {
    const id = await receiptIdByPublicId(deps.db, req.params.id, ownerOf(req));
    const dto = id ? await receiptDto(deps.db, id) : null;
    if (!dto) throw new AppError('NOT_FOUND');
    res.json(dto);
  });

  return r;
}
