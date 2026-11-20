import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_ENV = join(ROOT, '../connectmax/vendas/api/.env');

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
  try {
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
      database: map.DB_NAME || 'connectmax',
      max: 5,
      idleTimeoutMillis: 30_000,
    };
  } catch {
    throw new Error('DB não configurado (env DB_* ou vendas/api/.env)');
  }
}

export async function getPool() {
  if (pool) return pool;
  const cfg = await loadDbConfig();
  pool = new Pool(cfg);
  return pool;
}

export async function query(text, params) {
  const p = await getPool();
  return p.query(text, params);
}
