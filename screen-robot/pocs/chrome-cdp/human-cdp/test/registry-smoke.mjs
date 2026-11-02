#!/usr/bin/env node
/**
 * Aceite: list do disco + create/update/remove só de um CDP temporário.
 * Não mexe nos perfis já existentes.
 */
import {
  listCdps,
  getCdp,
  createCdp,
  updateCdp,
  removeCdp,
  statusCdp,
  profilesDir,
} from '../src/registry.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const SMOKE_ID = 'smoke-tmp-registry';
const SMOKE_PORT = 19299;

console.log('profilesDir', profilesDir());

const existing = listCdps().filter((c) => c.id !== SMOKE_ID);
console.log('listCdps() existentes', existing.length);
if (existing.length < 1) throw new Error('esperado ler ~/chrome-profiles');

if (getCdp(SMOKE_ID)) removeCdp(SMOKE_ID, { deleteProfile: true });

const beforeIds = new Set(listCdps().map((c) => c.id));
const created = createCdp({
  id: SMOKE_ID,
  name: 'Smoke Tmp Registry',
  port: SMOKE_PORT,
  defaultUrl: 'about:blank',
});
console.log('createCdp', created.id, created.preferredPort, created.hasMeta);

if (!created.hasMeta) throw new Error('meta não criada');
if (!existsSync(join(profilesDir(), SMOKE_ID, '.human-cdp.json'))) {
  throw new Error('meta ausente no disco');
}
if (!getCdp(SMOKE_ID)) throw new Error('getCdp falhou');

const updated = updateCdp(SMOKE_ID, {
  obs: 'smoke-ok',
  fingerprint: {
    lang: 'en-US',
    timezone: 'America/Fortaleza',
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  },
});
if (updated.obs !== 'smoke-ok') throw new Error('updateCdp falhou');
if (updated.fingerprint?.lang !== 'en-US') throw new Error('fingerprint não persistiu');
if (updated.fingerprint?.timezone !== 'America/Fortaleza') {
  throw new Error('fingerprint timezone ausente');
}

const cleared = updateCdp(SMOKE_ID, { fingerprint: null });
if (cleared.fingerprint) throw new Error('fingerprint null não removeu');
updateCdp(SMOKE_ID, {
  fingerprint: {
    lang: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  },
});

const st = await statusCdp(SMOKE_ID);
console.log('statusCdp', st.status, st.cdpUrl);

removeCdp(SMOKE_ID, { deleteProfile: true });
if (getCdp(SMOKE_ID)) throw new Error('removeCdp não removeu smoke');

const after = listCdps();
for (const id of beforeIds) {
  if (id === SMOKE_ID) continue;
  if (!after.some((c) => c.id === id)) {
    throw new Error(`CDP existente sumiu: ${id}`);
  }
}

console.log('listCdps() final', after.length);
console.log('ACEITE CRUD DISCO OK (existentes preservados)');
