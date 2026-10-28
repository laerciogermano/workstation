#!/usr/bin/env node
/**
 * Upsert servidores iniciais → POST /servidores/upsert
 *
 * Uso (API no ar):
 *   node scripts/seed-servidores.mjs
 *   API_URL=http://127.0.0.1:3000 node scripts/seed-servidores.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL ?? 'http://127.0.0.1:3000';
const jsonPath =
  process.env.SERVIDORES_JSON ??
  resolve(__dirname, '../data/servidores.seed.json');

const payload = JSON.parse(readFileSync(jsonPath, 'utf8'));
const servidores = Array.isArray(payload.servidores) ? payload.servidores : [];
if (!servidores.length) {
  console.error('nenhum servidor em', jsonPath);
  process.exit(1);
}

let created = 0;
let updated = 0;

for (const dto of servidores) {
  const res = await fetch(`${API}/servidores/upsert`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(dto),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error('fail', dto.nome ?? dto.ipPublico, res.status, body.slice(0, 400));
    process.exit(1);
  }
  const json = JSON.parse(body);
  if (json.created) created += 1;
  else updated += 1;
  console.log(
    json.created ? '+' : '~',
    json.servidor?.nome,
    json.servidor?.ipPublico,
  );
}

console.log('done', { total: servidores.length, created, updated, api: API });
