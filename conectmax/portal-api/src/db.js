import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_ENV = join(ROOT, '../connectmax/vendas/api/.env');

const require = createRequire(
  join(ROOT, '../connectmax/vendas/api/package.json'),
);
const { Pool } = require('pg');

/** @type {import('pg').Pool | null} */
let pool = null;

async function loadDbConfig() {
  if (process.env.DB_HOST && process.env.DB_PASSWORD) {
    return {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'connectmax',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'connectmax',
      max: 5,
      idleTimeoutMillis: 30_000,
    };
  }
  const text = await readFile(API_ENV, 'utf8');
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    host: map.DB_HOST,
    port: Number(map.DB_PORT || 5432),
    user: map.DB_USER,
    password: map.DB_PASSWORD,
    database: map.DB_NAME,
    max: 5,
    idleTimeoutMillis: 30_000,
  };
}

export async function getPool() {
  if (pool) return pool;
  const cfg = await loadDbConfig();
  if (!cfg.host || !cfg.password) {
    throw new Error('DB Contabo: faltando DB_HOST/DB_PASSWORD (env ou vendas/api/.env)');
  }
  pool = new Pool(cfg);
  pool.on('error', (err) => {
    console.error('pg pool error', err.message);
  });
  return pool;
}

export async function query(text, params) {
  const p = await getPool();
  return p.query(text, params);
}
