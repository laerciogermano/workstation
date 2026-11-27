import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { config } from '../config.js';

const dir = join(import.meta.dirname, '../../db/migrations');
const client = new pg.Client({ connectionString: config.databaseUrl });
await client.connect();
if (process.argv.includes('--reset')) {
  if (config.production) throw new Error('--reset é proibido em produção');
  await client.query('drop schema public cascade; create schema public;');
}
await client.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
for (const name of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if ((await client.query('select 1 from schema_migrations where name = $1', [name])).rowCount) continue;
  await client.query('begin');
  await client.query(readFileSync(join(dir, name), 'utf8'));
  await client.query('insert into schema_migrations (name) values ($1)', [name]);
  await client.query('commit');
  console.log('migração aplicada:', name);
}
await client.end();
