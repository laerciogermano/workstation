import type { MeDTO } from '@notinhas/contracts';
import { quoteCredits } from '@notinhas/domain';
import type { Db, Queryable, Tx } from '../../shared/db.js';
import type { Owner, RequestContext } from '../../shared/http/context.js';
import { ownerSql } from '../../shared/http/context.js';

export async function pointsAndCredits(db: Queryable, owner: Owner): Promise<{ points: number; credits: number }> {
  const p = ownerSql(owner, 'pe', 1);
  const u = ownerSql(owner, 'ue', 1);
  const { rows } = await db.query<{ points: number; used: number }>(
    `SELECT (SELECT coalesce(sum(points), 0)::int FROM point_events pe WHERE ${p.sql}) AS points,
            (SELECT count(*)::int FROM usage_events ue WHERE ${u.sql} AND ue.created_at > now() - interval '30 days') AS used`,
    [p.param],
  );
  const r = rows[0] ?? { points: 0, used: 0 };
  return { points: r.points, credits: quoteCredits(r.points, r.used) };
}

export async function buildMe(db: Db, ctx: RequestContext): Promise<MeDTO> {
  let user: MeDTO['user'] = null;
  if (ctx.user) {
    const { rows } = await db.query<{ email: string; name: string | null; role: 'user' | 'admin'; is_store_opt_in: boolean }>(
      'SELECT email, name, role, is_store_opt_in FROM users WHERE id = $1 AND deleted_at IS NULL',
      [ctx.user.id],
    );
    const u = rows[0];
    if (u) user = { id: ctx.user.publicId, email: u.email, name: u.name, role: u.role, storeOptIn: u.is_store_opt_in };
  }
  const owner: Owner | null = ctx.user
    ? { userId: ctx.user.id, visitorId: null }
    : ctx.visitor
      ? { userId: null, visitorId: ctx.visitor.id }
      : null;
  const pc = owner ? await pointsAndCredits(db, owner) : { points: 0, credits: 0 };

  let pending = { receipts: 0, lists: 0, points: 0 };
  if (!ctx.user && ctx.visitor) {
    const { rows } = await db.query<{ receipts: number; lists: number; points: number }>(
      `SELECT (SELECT count(*)::int FROM receipt_owners WHERE visitor_id = $1 AND user_id IS NULL) AS receipts,
              (SELECT count(*)::int FROM shopping_lists WHERE visitor_id = $1 AND user_id IS NULL) AS lists,
              (SELECT coalesce(sum(points), 0)::int FROM point_events WHERE visitor_id = $1 AND user_id IS NULL) AS points`,
      [ctx.visitor.id],
    );
    pending = rows[0] ?? pending;
  }
  return { visitorId: ctx.visitor?.publicId ?? '', ip: ctx.ip, user, points: pc.points, credits: pc.credits, pending };
}

/** REQ-050: tudo que estava sob o fingerprint passa a ser da conta. Idempotente. */
export async function mergeVisitorIntoUser(tx: Tx, visitorId: number, userId: number): Promise<void> {
  // nota que já está no histórico da conta não duplica
  await tx.query(
    `DELETE FROM receipt_owners ro WHERE ro.visitor_id = $1 AND ro.user_id IS NULL
       AND EXISTS (SELECT 1 FROM receipt_owners x WHERE x.receipt_id = ro.receipt_id AND x.user_id = $2)`,
    [visitorId, userId],
  );
  await tx.query('UPDATE receipt_owners SET user_id = $2 WHERE visitor_id = $1 AND user_id IS NULL', [visitorId, userId]);
  await tx.query('UPDATE shopping_lists SET user_id = $2 WHERE visitor_id = $1 AND user_id IS NULL', [visitorId, userId]);
  await tx.query('UPDATE point_events SET user_id = $2 WHERE visitor_id = $1 AND user_id IS NULL', [visitorId, userId]);
  await tx.query('UPDATE usage_events SET user_id = $2 WHERE visitor_id = $1 AND user_id IS NULL', [visitorId, userId]);
  await tx.query(
    'UPDATE barcode_links SET linked_by_user_id = $2 WHERE linked_by_visitor_id = $1 AND linked_by_user_id IS NULL',
    [visitorId, userId],
  );
  await tx.query(
    'UPDATE barcode_registrations SET linked_by_user_id = $2 WHERE linked_by_visitor_id = $1 AND linked_by_user_id IS NULL',
    [visitorId, userId],
  );
  await tx.query(
    'UPDATE photo_registrations SET linked_by_user_id = $2 WHERE linked_by_visitor_id = $1 AND linked_by_user_id IS NULL',
    [visitorId, userId],
  );
  await tx.query('UPDATE ingest_failures SET user_id = $2 WHERE visitor_id = $1 AND user_id IS NULL', [visitorId, userId]);
  await tx.query('UPDATE visitors SET user_id = $2, merged_at = now() WHERE id = $1', [visitorId, userId]);
}
