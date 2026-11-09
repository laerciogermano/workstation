import { Router } from 'express';
import { z } from 'zod';
import type { PointsDTO, SpendingDTO } from '@notinhas/contracts';
import { CATEGORIES, classifyProduct } from '@notinhas/domain';
import type { Deps } from '../../shared/deps.js';
import { ownerOf, ownerSql } from '../../shared/http/context.js';
import { parse } from '../../shared/http/validate.js';
import { pointsAndCredits } from '../identity/identity.service.js';

/** T-52 · US-04.05/06 — derivado de Minhas notas, privado ao titular (RN-14). */
export function spendingRoutes(deps: Deps): Router {
  const { db } = deps;
  const r = Router();

  r.get('/', async (req, res) => {
    const { meses } = parse(z.object({ meses: z.coerce.number().int().min(1).max(24).default(6) }), req.query);
    const o = ownerSql(ownerOf(req), 'ro', 1);
    const base = `FROM receipt_owners ro JOIN receipts r ON r.id = ro.receipt_id
                  WHERE ${o.sql} AND coalesce(r.issued_at, r.created_at) >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - make_interval(months => $2 - 1)`;

    const months = await db.query<{ month: string; total: number; receipts: number }>(
      `SELECT to_char(coalesce(r.issued_at, r.created_at) AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month,
              coalesce(sum(r.total_cents), 0)::int AS total, count(*)::int AS receipts
       ${base} GROUP BY 1 ORDER BY 1`,
      [o.param, meses],
    );
    const byStore = await db.query<{ id: number; display_name: string; neighborhood: string | null; total: number; receipts: number }>(
      `SELECT s.id, s.display_name, s.neighborhood, coalesce(sum(r.total_cents), 0)::int AS total, count(*)::int AS receipts
       ${base.replace('JOIN receipts r ON r.id = ro.receipt_id', 'JOIN receipts r ON r.id = ro.receipt_id JOIN stores s ON s.id = r.store_id')}
       GROUP BY s.id ORDER BY total DESC`,
      [o.param, meses],
    );
    const items = await db.query<{ description: string; category: string | null; total: number }>(
      `SELECT ri.description, p.category, ri.total_cents AS total
       ${base.replace('JOIN receipts r ON r.id = ro.receipt_id', 'JOIN receipts r ON r.id = ro.receipt_id JOIN receipt_items ri ON ri.receipt_id = r.id LEFT JOIN barcode_links bl ON bl.store_id = ri.store_id AND bl.store_code = ri.store_code LEFT JOIN products p ON p.gtin = bl.gtin')}`,
      [o.param, meses],
    );
    const cat = new Map<string, number>();
    for (const it of items.rows) {
      const id = it.category ?? classifyProduct(it.description).category;
      cat.set(id, (cat.get(id) ?? 0) + it.total);
    }
    const name = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? 'Outros';
    const dto: SpendingDTO = {
      months: months.rows.map((m) => ({ month: m.month, totalCents: m.total, receipts: m.receipts })),
      byStore: byStore.rows.map((s) => ({ store: { id: s.id, name: s.display_name, neighborhood: s.neighborhood }, totalCents: s.total, receipts: s.receipts })),
      byCategory: [...cat.entries()].map(([id, total]) => ({ category: name(id), totalCents: total })).sort((a, b) => b.totalCents - a.totalCents),
    };
    res.json(dto);
  });

  return r;
}

/** T-53 · REQ-052 — saldo, crédito e extrato de pontos. */
export function pointsRoutes(deps: Deps): Router {
  const r = Router();
  r.get('/', async (req, res) => {
    const owner = ownerOf(req);
    const o = ownerSql(owner, 'pe', 1);
    const { rows } = await deps.db.query<{ kind: 'receipt' | 'eanLink'; points: number; created_at: Date; label: string }>(
      `SELECT pe.kind, pe.points, pe.created_at, pe.label FROM point_events pe WHERE ${o.sql} ORDER BY pe.created_at DESC LIMIT 100`,
      [o.param],
    );
    const pc = await pointsAndCredits(deps.db, owner);
    const dto: PointsDTO = {
      balance: pc.points,
      credits: pc.credits,
      events: rows.map((e) => ({ kind: e.kind, points: e.points, createdAt: e.created_at.toISOString(), label: e.label })),
    };
    res.json(dto);
  });
  return r;
}
