import type { DbOrTx } from './db/db';
import { auditLog } from './db/schema';
import { newId } from './kernel/ids';

export async function audit(
  db: DbOrTx,
  e: { actorId: string | null; action: string; entity: string; entityId?: string | null; payload?: Record<string, unknown> },
): Promise<void> {
  await db.insert(auditLog).values({ id: newId(), actorId: e.actorId, action: e.action, entity: e.entity, entityId: e.entityId ?? null, payload: e.payload ?? {} });
}
