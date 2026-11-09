import { Router } from 'express';
import { z } from 'zod';
import { HideItemSchema, ResolveFlagSchema, type AdminMetricsDTO, type IngestFailureDTO, type ModerationFlagDTO } from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { withTx } from '../../shared/db.js';
import { requireAdmin } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { retryFailure } from '../receipts/ingest-receipt.js';

const Id = z.coerce.number().int().positive();

/** T-61/62/63 · US-ADM.01..03 — toda rota exige role admin; ações vão para audit_log. */
export function adminRoutes(deps: Deps): Router {
  const { db } = deps;
  const r = Router();
  r.use((req, _res, next) => {
    requireAdmin(req);
    next();
  });

  r.get('/metricas', async (_req, res) => {
    const { rows } = await db.query<Omit<AdminMetricsDTO, 'eanCoverage' | 'receiptsByDay'> & { items_distinct: number }>(
      `SELECT (SELECT count(*)::int FROM stores) AS stores,
              (SELECT count(*)::int FROM receipts) AS receipts,
              (SELECT count(*)::int FROM receipt_items) AS items,
              (SELECT count(DISTINCT (store_id, store_code))::int FROM receipt_items) AS items_distinct,
              (SELECT count(*)::int FROM barcode_links) AS links,
              (SELECT count(*)::int FROM products) AS products,
              (SELECT count(*)::int FROM users WHERE deleted_at IS NULL) AS users,
              (SELECT count(*)::int FROM visitors) AS visitors,
              (SELECT count(*)::int FROM ingest_failures WHERE status = 'pending') AS "pendingFailures",
              (SELECT count(*)::int FROM moderation_flags WHERE status = 'open') AS "openFlags"`,
    );
    const m = rows[0];
    if (!m) throw new AppError('INTERNAL');
    const days = await db.query<{ day: string; count: number }>(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, (SELECT count(*)::int FROM receipts r WHERE r.created_at::date = d::date) AS count
       FROM generate_series(current_date - 13, current_date, interval '1 day') d ORDER BY d`,
    );
    const { items_distinct, ...rest } = m;
    res.json({ ...rest, eanCoverage: items_distinct ? m.links / items_distinct : 0, receiptsByDay: days.rows } satisfies AdminMetricsDTO);
  });

  r.get('/falhas', async (_req, res) => {
    const { rows } = await db.query<{ id: number; access_key: string | null; error_code: string; error_message: string | null; attempts: number; status: IngestFailureDTO['status']; created_at: Date; updated_at: Date }>(
      `SELECT id, access_key, error_code, error_message, attempts, status, created_at, updated_at
       FROM ingest_failures ORDER BY (status = 'pending') DESC, updated_at DESC LIMIT 100`,
    );
    res.json(
      rows.map((f): IngestFailureDTO => ({
        id: f.id, accessKey: f.access_key, errorCode: f.error_code, errorMessage: f.error_message, attempts: f.attempts,
        status: f.status, createdAt: f.created_at.toISOString(), updatedAt: f.updated_at.toISOString(),
      })),
    );
  });

  r.post('/falhas/:id/reprocessar', async (req, res) => {
    const id = parse(Id, req.params.id);
    const out = await retryFailure(deps, id);
    if (out.ok) deps.index.invalidate();
    await db.query(`INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES ($1, 'retry_ingest', 'ingest_failure', $2)`, [req.ctx.user?.id, String(id)]);
    res.json(out);
  });

  r.get('/moderacao', async (_req, res) => {
    const flags = await db.query<{ id: number; kind: ModerationFlagDTO['kind']; summary: string; status: ModerationFlagDTO['status']; created_at: Date; item_id: number | null }>(
      `SELECT id, kind, summary, status, created_at, item_id FROM moderation_flags ORDER BY (status = 'open') DESC, created_at DESC LIMIT 100`,
    );
    res.json(flags.rows.map((f): ModerationFlagDTO => ({ id: f.id, kind: f.kind, summary: f.summary, status: f.status, createdAt: f.created_at.toISOString(), itemId: f.item_id })));
  });

  // keep = mantém o vínculo atual · replace = troca pelo proposto · hide = oculta o item do índice
  r.post('/moderacao/:id', async (req, res) => {
    const id = parse(Id, req.params.id);
    const { action } = parse(ResolveFlagSchema, req.body);
    await withTx(db, async (tx) => {
      const { rows } = await tx.query<{ store_id: number | null; store_code: string | null; proposed_gtin: string | null; item_id: number | null }>(
        `UPDATE moderation_flags SET status = 'resolved', resolved_at = now() WHERE id = $1 AND status = 'open'
         RETURNING store_id, store_code, proposed_gtin, item_id`,
        [id],
      );
      const f = rows[0];
      if (!f) throw new AppError('NOT_FOUND');
      if (action === 'replace' && f.store_id && f.store_code && f.proposed_gtin) {
        await tx.query('UPDATE barcode_links SET gtin = $3 WHERE store_id = $1 AND store_code = $2', [f.store_id, f.store_code, f.proposed_gtin]);
      }
      if (action === 'hide' && f.item_id) {
        await tx.query(`UPDATE receipt_items SET is_hidden = true, hidden_reason = 'moderação' WHERE id = $1`, [f.item_id]);
      }
      await tx.query(`INSERT INTO audit_log (user_id, action, entity, entity_id, payload) VALUES ($1, 'resolve_flag', 'moderation_flag', $2, $3)`, [
        req.ctx.user?.id,
        String(id),
        { action },
      ]);
    });
    deps.index.invalidate();
    res.json({ ok: true });
  });

  // US-ADM.02 — ocultar remove do índice público sem apagar a nota
  r.post('/itens/:id/ocultar', async (req, res) => {
    const id = parse(Id, req.params.id);
    const { reason } = parse(HideItemSchema, req.body);
    const { rowCount } = await db.query('UPDATE receipt_items SET is_hidden = true, hidden_reason = $2 WHERE id = $1', [id, reason]);
    if (!rowCount) throw new AppError('NOT_FOUND');
    await db.query(`INSERT INTO audit_log (user_id, action, entity, entity_id, payload) VALUES ($1, 'hide_item', 'receipt_item', $2, $3)`, [req.ctx.user?.id, String(id), { reason }]);
    deps.index.invalidate();
    res.json({ ok: true });
  });

  return r;
}
