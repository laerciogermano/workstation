import { POINTS, type PointKind } from '@notinhas/domain';
import type { Queryable } from '../../shared/db.js';
import type { Owner } from '../../shared/http/context.js';

/** Credita pontos uma única vez por (kind, ref). Retorna os pontos dados (0 se já existia). */
export async function awardPoints(db: Queryable, owner: Owner, kind: PointKind, ref: string, label: string): Promise<number> {
  const { rowCount } = await db.query(
    `INSERT INTO point_events (visitor_id, user_id, kind, points, ref, label)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (kind, ref) DO NOTHING`,
    [owner.visitorId, owner.userId, kind, POINTS[kind], ref, label.slice(0, 120)],
  );
  return rowCount ? POINTS[kind] : 0;
}
