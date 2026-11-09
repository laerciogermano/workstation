import pg from 'pg';

// numeric → number (quantidades); bigint (int8) → number: ids cabem em 2^53.
pg.types.setTypeParser(1700, (v) => Number(v));
pg.types.setTypeParser(20, (v) => Number(v));

export type Db = pg.Pool;
export type Tx = pg.PoolClient;
export type Queryable = Pick<pg.Pool, 'query'>;

export function createPool(databaseUrl: string, schema: string): Db {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    // search_path por conexão (compatível com PgBouncer em modo session; em transaction use SET LOCAL)
    options: `-c search_path=${schema},public`,
    application_name: 'notinhas-api',
  });
  return pool;
}

/** Transação curta — nunca chamar rede externa aqui dentro (08 §6). */
export async function withTx<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}
