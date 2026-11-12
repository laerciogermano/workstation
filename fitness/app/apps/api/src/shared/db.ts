import pg from 'pg';

// numeric → number; date → string ISO (dia de calendário, sem fuso)
pg.types.setTypeParser(1700, (v) => Number.parseFloat(v));
pg.types.setTypeParser(1082, (v) => v);

export type Db = pg.Pool;
export type Tx = pg.PoolClient;
export type Queryable = Pick<pg.Pool, 'query'>;

export function createPool(connectionString: string): Db {
  return new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    // schema dedicado; parametrizado na conexão para não depender de cada query
    options: '-c search_path=fitness,public',
  });
}

/** Transação curta: nada de I/O externo aqui dentro. */
export async function withTx<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
