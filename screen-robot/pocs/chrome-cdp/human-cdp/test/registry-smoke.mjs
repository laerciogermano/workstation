#!/usr/bin/env node
/**
 * Aceite: list do disco + create/update/remove só de um CDP temporário.
 * Não mexe nos start-*.sh / perfis já existentes.
 */
import {
  listCdps,
  getCdp,
  createCdp,
  updateCdp,
  removeCdp,
  statusCdp,
  scriptsDir,
} from '../src/registry.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const SMOKE_ID = 'smoke-tmp-registry';
const SMOKE_PORT = 19299;

console.log('scriptsDir', scriptsDir());

const existing = listCdps().filter((c) => c.id !== SMOKE_ID);
console.log('listCdps() existentes', existing.length);
if (existing.length < 1) throw new Error('esperado ler start-*.sh do disco');

// limpa só o smoke se sobrou de run anterior
if (getCdp(SMOKE_ID)) removeCdp(SMOKE_ID, { deleteProfile: false });

const beforeIds = new Set(listCdps().map((c) => c.id));
const created = createCdp({
  id: SMOKE_ID,
  name: 'Smoke Tmp Registry',
  port: SMOKE_PORT,
  platform: 'test',
});
console.log('createCdp', created.id, created.port, created.startScriptPath);

if (!existsSync(created.startScriptPath)) throw new Error('script não criado');
if (!getCdp(SMOKE_ID) || !getCdp(SMOKE_PORT)) throw new Error('getCdp falhou');

const updated = updateCdp(SMOKE_ID, { platform: 'test-updated' });
if (updated.platform !== 'test-updated') throw new Error('updateCdp falhou');

const st = await statusCdp(SMOKE_ID);
console.log('statusCdp', st.status, st.cdpUrl);

// remove só o temporário — perfil smoke pode ficar vazio; não apaga outros
removeCdp(SMOKE_ID, { deleteProfile: true });
if (getCdp(SMOKE_ID)) throw new Error('removeCdp não removeu smoke');
if (existsSync(join(scriptsDir(), `start-${SMOKE_ID}.sh`))) {
  throw new Error('script smoke ainda no disco');
}

// garantia: nenhum id pré-existente sumiu
const after = listCdps();
for (const id of beforeIds) {
  if (id === SMOKE_ID) continue;
  if (!after.some((c) => c.id === id)) {
    throw new Error(`CDP existente sumiu: ${id}`);
  }
}

console.log('listCdps() final', after.length);
console.log('ACEITE CRUD DISCO OK (existentes preservados)');
