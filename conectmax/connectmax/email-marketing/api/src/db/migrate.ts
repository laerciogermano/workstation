// Executa as migrações SQL versionadas em ordem, uma vez cada, dentro de transação.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { loadConfig } from '../shared/config.ts';

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function migrate(databaseUrl: string): Promise<string[]> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`create table if not exists public.email_marketing_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);
    // lock para não rodar duas migrações em paralelo
    await client.query('select pg_advisory_lock(728301)');
    const { rows } = await client.query<{ name: string }>('select name from public.email_marketing_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    const ran: string[] = [];
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into public.email_marketing_migrations (name) values ($1)', [file]);
        await client.query('commit');
        ran.push(file);
      } catch (err) {
        await client.query('rollback');
        throw new Error(`Falha na migração ${file}`, { cause: err });
      }
    }
    return ran;
  } finally {
    await client.query('select pg_advisory_unlock(728301)').catch(() => {});
    await client.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const config = loadConfig();
  const ran = await migrate(config.DATABASE_URL);
  console.log(ran.length ? `Aplicadas: ${ran.join(', ')}` : 'Nada a aplicar.');
}
