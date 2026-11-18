import pg from "pg";
import { config } from "../config";
import { logger } from "../logger";

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000, statement_timeout: 15_000 });
pool.on("error", err => logger.error({ err }, "erro no pool do Postgres"));
export type Db = pg.PoolClient;

/** Transação com lock consultivo por projeto (evita corrida em posições/sequência). */
export async function withTx<T>(fn: (db: Db) => Promise<T>, lockProject?: number): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("begin");
    if (lockProject != null) await db.query("select pg_advisory_xact_lock($1)", [lockProject]);
    const out = await fn(db);
    await db.query("commit");
    return out;
  } catch (e) {
    await db.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    db.release();
  }
}
