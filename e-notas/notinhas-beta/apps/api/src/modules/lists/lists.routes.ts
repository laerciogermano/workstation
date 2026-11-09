import { Router, type Request } from 'express';
import { CreateListSchema, GeoQuerySchema, GtinSchema, RenameListSchema, SetListItemSchema, type ListDetailDTO, type ListSummaryDTO, type QuoteDTO } from '@notinhas/contracts';
import { quoteBasket } from '@notinhas/domain';
import type { Deps } from '../../shared/deps.js';
import { ownerOf, ownerSql, type Owner } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { anchorOf } from '../catalog/catalog.service.js';
import { toQuoteDto } from '../catalog/quote-dto.js';
import { pointsAndCredits } from '../identity/identity.service.js';

type ListRow = { id: number; public_id: string; name: string; updated_at: Date };

export function listsRoutes(deps: Deps): Router {
  const { db } = deps;
  const r = Router();

  async function findList(req: Request, owner: Owner): Promise<ListRow> {
    const id = String(req.params['id'] ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError('NOT_FOUND');
    const o = ownerSql(owner, 'l', 2);
    const { rows } = await db.query<ListRow>(`SELECT l.id, l.public_id, l.name, l.updated_at FROM shopping_lists l WHERE l.public_id = $1 AND ${o.sql}`, [id, o.param]);
    if (!rows[0]) throw new AppError('NOT_FOUND', 'Lista não encontrada.');
    return rows[0];
  }

  async function listItems(listId: number) {
    const { rows } = await db.query<{ gtin: string; quantity: number; title: string; photo_url: string | null }>(
      `SELECT li.gtin, li.quantity, p.title, p.photo_url FROM shopping_list_items li JOIN products p ON p.gtin = li.gtin
       WHERE li.list_id = $1 ORDER BY li.created_at`,
      [listId],
    );
    return rows;
  }

  // T-40 — várias listas (REQ-051)
  r.get('/', async (req, res) => {
    const owner = ownerOf(req);
    const o = ownerSql(owner, 'l', 1);
    const { rows } = await db.query<ListRow & { item_count: number }>(
      `SELECT l.id, l.public_id, l.name, l.updated_at, count(li.gtin)::int AS item_count
       FROM shopping_lists l LEFT JOIN shopping_list_items li ON li.list_id = l.id
       WHERE ${o.sql} GROUP BY l.id ORDER BY l.updated_at DESC`,
      [o.param],
    );
    const snap = await deps.index.get();
    const out: ListSummaryDTO[] = [];
    for (const l of rows) {
      const items = await listItems(l.id);
      const q = items.length ? quoteBasket(snap.observations, items, [...snap.stores.keys()], snap.at) : null;
      out.push({ id: l.public_id, name: l.name, itemCount: l.item_count, updatedAt: l.updated_at.toISOString(), bestTotalCents: q?.reference?.totalCents ?? null });
    }
    res.json(out);
  });

  r.post('/', async (req, res) => {
    const owner = ownerOf(req);
    const { name } = parse(CreateListSchema, req.body);
    const { rows } = await db.query<ListRow>(
      'INSERT INTO shopping_lists (visitor_id, user_id, name) VALUES ($1, $2, $3) RETURNING id, public_id, name, updated_at',
      [owner.visitorId, owner.userId, name],
    );
    const l = rows[0];
    if (!l) throw new AppError('INTERNAL');
    res.status(201).json({ id: l.public_id, name: l.name, itemCount: 0, updatedAt: l.updated_at.toISOString(), bestTotalCents: null } satisfies ListSummaryDTO);
  });

  // T-42 / T-41 — cotação “uma loja” e “dividir entre lojas” (RN-13). Gate de crédito (T-54, REQ-052).
  r.get('/:id', async (req, res) => {
    const owner = ownerOf(req);
    const list = await findList(req, owner);
    const anchor = anchorOf(parse(GeoQuerySchema, req.query));
    const items = await listItems(list.id);
    let { credits } = await pointsAndCredits(db, owner);
    let quote: QuoteDTO | null = null;
    if (items.length) {
      // 1 crédito por lista por dia; reabrir no mesmo dia não cobra de novo
      const ref = `list:${list.public_id}:${deps.clock.now().toISOString().slice(0, 10)}`;
      const o = ownerSql(owner, 'ue', 2);
      const used = await db.query(`SELECT 1 FROM usage_events ue WHERE ue.ref = $1 AND ${o.sql}`, [ref, o.param]);
      if (used.rowCount || credits > 0) {
        if (!used.rowCount) {
          await db.query(`INSERT INTO usage_events (visitor_id, user_id, kind, ref) VALUES ($1, $2, 'quote', $3)`, [owner.visitorId, owner.userId, ref]);
          credits -= 1;
        }
        quote = toQuoteDto(await deps.index.get(), items, anchor);
      }
    }
    const dto: ListDetailDTO = {
      id: list.public_id,
      name: list.name,
      items: items.map((i) => ({ gtin: i.gtin, title: i.title, photoUrl: i.photo_url, quantity: i.quantity })),
      quote,
      credits,
    };
    res.json(dto);
  });

  r.patch('/:id', async (req, res) => {
    const list = await findList(req, ownerOf(req));
    const { name } = parse(RenameListSchema, req.body);
    await db.query('UPDATE shopping_lists SET name = $2 WHERE id = $1', [list.id, name]);
    res.json({ ok: true });
  });

  r.delete('/:id', async (req, res) => {
    const list = await findList(req, ownerOf(req));
    await db.query('DELETE FROM shopping_lists WHERE id = $1', [list.id]);
    res.status(204).end();
  });

  // adicionar / alterar quantidade / remover (quantity 0)
  r.put('/:id/itens/:gtin', async (req, res) => {
    const list = await findList(req, ownerOf(req));
    const gtin = parse(GtinSchema, req.params['gtin']);
    const { quantity } = parse(SetListItemSchema, req.body);
    if (quantity === 0) {
      await db.query('DELETE FROM shopping_list_items WHERE list_id = $1 AND gtin = $2', [list.id, gtin]);
    } else {
      const exists = await db.query('SELECT 1 FROM products WHERE gtin = $1', [gtin]);
      if (!exists.rowCount) throw new AppError('NOT_FOUND', 'Produto sem ficha no catálogo.');
      await db.query(
        `INSERT INTO shopping_list_items (list_id, gtin, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (list_id, gtin) DO UPDATE SET quantity = EXCLUDED.quantity`,
        [list.id, gtin, quantity],
      );
    }
    await db.query('UPDATE shopping_lists SET updated_at = now() WHERE id = $1', [list.id]);
    res.json({ ok: true });
  });

  return r;
}
