import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import type { Env } from '../shared/env.js';
import type { Logger } from '../shared/logger.js';

/** Migrations SQL versionadas e imutáveis (08 §6): aplicadas em ordem, cada uma numa transação, com advisory lock. */
function migrationsDir(): string {
  for (const rel of ['../../migrations', '../migrations']) {
    const p = fileURLToPath(new URL(rel, import.meta.url));
    if (existsSync(p)) return p;
  }
  throw new Error('pasta migrations/ não encontrada');
}

export async function migrate(env: Pick<Env, 'DATABASE_URL' | 'DB_SCHEMA'>, log: Pick<Logger, 'info'>): Promise<string[]> {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [`migrate:${env.DB_SCHEMA}`]);
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${env.DB_SCHEMA}`);
    await client.query(`SET search_path TO ${env.DB_SCHEMA}, public`);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const done = new Set((await client.query<{ version: string }>('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
    const dir = migrationsDir();
    for (const file of readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()) {
      if (done.has(file)) continue;
      await client.query('BEGIN');
      try {
        await client.query(readFileSync(`${dir}/${file}`, 'utf8'));
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
        log.info({ file }, 'migration aplicada');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [`migrate:${env.DB_SCHEMA}`]).catch(() => undefined);
    await client.end();
  }
  return applied;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { loadEnv } = await import('../shared/env.js');
  const env = loadEnv();
  const out = await migrate(env, { info: (o: object, m?: string) => console.log(m ?? '', o) } as Pick<Logger, 'info'>);
  console.log(out.length ? `ok: ${out.join(', ')}` : 'nada a aplicar');
}
