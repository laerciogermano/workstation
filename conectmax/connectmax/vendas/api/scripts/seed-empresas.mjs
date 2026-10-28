#!/usr/bin/env node
/**
 * Importa docs/planilhas-funil/empresas.json → POST /empresas/import
 *
 * Uso (API no ar):
 *   node scripts/seed-empresas.mjs
 *   API_URL=http://127.0.0.1:3000 node scripts/seed-empresas.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL ?? 'http://127.0.0.1:3000';
const jsonPath =
  process.env.EMPRESAS_JSON ??
  resolve(__dirname, '../../../docs/planilhas-funil/empresas.json');

const payload = JSON.parse(readFileSync(jsonPath, 'utf8'));
const empresas = Array.isArray(payload.empresas) ? payload.empresas : [];
if (!empresas.length) {
  console.error('nenhuma empresa em', jsonPath);
  process.exit(1);
}

const CHUNK = 120;
let created = 0;
let updated = 0;

async function postChunk(slice, attempt = 1) {
  const res = await fetch(`${API}/empresas/import`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ empresas: slice }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

for (let i = 0; i < empresas.length; i += CHUNK) {
  const slice = empresas.slice(i, i + CHUNK);
  let json;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      json = await postChunk(slice, attempt);
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      console.warn(`retry chunk ${i / CHUNK + 1} (tentativa ${attempt}):`, e.message);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  created += json.created ?? 0;
  updated += json.updated ?? 0;
  console.log(
    `chunk ${i / CHUNK + 1}: +${json.created} ~${json.updated} (até ${i + slice.length}/${empresas.length})`,
  );
}

console.log('done', { total: empresas.length, created, updated, api: API });
