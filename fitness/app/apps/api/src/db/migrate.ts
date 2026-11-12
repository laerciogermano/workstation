/**
 * Runner de migrations: aplica arquivos `NNN_nome.sql` em ordem, cada um numa transação,
 * com advisory lock (duas instâncias não migram ao mesmo tempo). Migration aplicada é imutável:
 * o checksum é conferido e divergência aborta.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const LOCK_ID = 7_331_001;

export async function migrate(databaseUrl: string, log: (m: string) => void = console.log): Promise<number> {
  const dir = fileURLToPath(new URL('./migrations/', import.meta.url));
  const files = (await readdir(dir)).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  let applied = 0;
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query('CREATE SCHEMA IF NOT EXISTS fitness');
    await client.query(`CREATE TABLE IF NOT EXISTS fitness.schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    const done = new Map(
      (
        await client.query<{ name: string; checksum: string }>('SELECT name, checksum FROM fitness.schema_migrations')
      ).rows.map((r) => [r.name, r.checksum]),
    );
    for (const f of files) {
      const sql = await readFile(dir + f, 'utf8');
      const sum = createHash('sha256').update(sql).digest('hex');
      const prev = done.get(f);
      if (prev) {
        if (prev !== sum) throw new Error(`migration ${f} foi editada depois de aplicada; crie uma nova`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO fitness.schema_migrations (name, checksum) VALUES ($1, $2)', [f, sum]);
        await client.query('COMMIT');
        applied++;
        log(`✓ ${f}`);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await client.end();
  }
  return applied;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL ausente');
  const n = await migrate(url);
  console.log(n ? `${n} migration(s) aplicada(s)` : 'banco já está atualizado');
}
