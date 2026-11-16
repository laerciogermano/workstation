// Fila de envio sobre a própria tabela `deliveries` (ADR 0002).
// Semântica at-least-once: uma entrega travada por worker morto volta para pending.
import type { Db } from '../../shared/db.ts';
import type { DeliveryToSend } from './build-message.ts';

export type ClaimedDelivery = DeliveryToSend & { id: string; attempts: number };

export const STALE_LOCK_SECONDS = 300;

export function createSendQueue(db: Db) {
  return {
    /** Trava até `limit` entregas prontas. SKIP LOCKED permite vários workers em paralelo. */
    async claim(limit: number): Promise<ClaimedDelivery[]> {
      const { rows } = await db.query<{
        id: string;
        public_id: string;
        email: string;
        attempts: number;
        subject: string;
        body_html: string;
      }>(
        `with next as (
           select d.id
             from deliveries d
            where d.status = 'pending' and d.next_attempt_at <= now()
            order by d.next_attempt_at, d.id
            limit $1
            for update skip locked
         )
         update deliveries d
            set status = 'sending', locked_at = now(), attempts = d.attempts + 1
           from next, campaigns c
          where d.id = next.id and c.id = d.campaign_id
         returning d.id, d.public_id, d.email, d.attempts, c.subject, c.body_html`,
        [limit],
      );
      return rows.map((r) => ({
        id: r.id,
        publicId: r.public_id,
        email: r.email,
        attempts: r.attempts,
        subject: r.subject,
        bodyHtml: r.body_html,
      }));
    },

    async isSuppressed(email: string): Promise<boolean> {
      const { rowCount } = await db.query('select 1 from suppressions where email = $1', [email]);
      return Boolean(rowCount);
    },

    async markSent(id: string): Promise<void> {
      await db.query(
        "update deliveries set status = 'sent', sent_at = now(), locked_at = null, last_error = null where id = $1",
        [id],
      );
    },

    async markSkipped(id: string, reason: string): Promise<void> {
      await db.query("update deliveries set status = 'skipped', locked_at = null, last_error = $2 where id = $1", [
        id,
        reason,
      ]);
    },

    /** Falha: reagenda com backoff exponencial ou desiste após o máximo de tentativas. */
    async markFailed(
      id: string,
      error: string,
      { attempts, maxAttempts, permanent }: { attempts: number; maxAttempts: number; permanent: boolean },
    ): Promise<'retry' | 'failed'> {
      const giveUp = permanent || attempts >= maxAttempts;
      const backoffSeconds = 30 * 2 ** (attempts - 1);
      await db.query(
        `update deliveries
            set status = $2, locked_at = null, last_error = $3,
                next_attempt_at = now() + make_interval(secs => $4)
          where id = $1`,
        [id, giveUp ? 'failed' : 'pending', error.slice(0, 1000), giveUp ? 0 : backoffSeconds],
      );
      return giveUp ? 'failed' : 'retry';
    },

    /** Devolve para a fila entregas presas em `sending` por worker que caiu. */
    async releaseStale(): Promise<number> {
      const { rowCount } = await db.query(
        `update deliveries set status = 'pending', locked_at = null
          where status = 'sending' and locked_at < now() - make_interval(secs => $1)`,
        [STALE_LOCK_SECONDS],
      );
      return rowCount ?? 0;
    },

    /** Campanhas sem nada pendente passam para `sent`. */
    async finishCampaigns(): Promise<number> {
      const { rowCount } = await db.query(
        `update campaigns c set status = 'sent', finished_at = now()
          where c.status = 'sending'
            and not exists (
              select 1 from deliveries d
               where d.campaign_id = c.id and d.status in ('pending', 'sending')
            )`,
      );
      return rowCount ?? 0;
    },
  };
}

export type SendQueue = ReturnType<typeof createSendQueue>;
