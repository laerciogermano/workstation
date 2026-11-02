#!/usr/bin/env node
/**
 * Aceite contrato CRUD (sem start/stop destrutivo em portas de lab).
 *   node test/registry-smoke.mjs
 */
import {
  listCdps,
  getCdp,
  createCdp,
  updateCdp,
  removeCdp,
  statusCdp,
  storePath,
} from '../src/registry.mjs';

console.log('store', storePath());

const before = listCdps().length;
console.log('listCdps()', before);

const tmpPort = 19299;
if (getCdp(tmpPort)) removeCdp(tmpPort);

const created = createCdp({
  name: 'smoke-tmp',
  port: tmpPort,
  userDataDir: '~/chrome-profiles/smoke-tmp',
  startScript: 'screen-robot/pocs/chrome-cdp/start-germano.sh',
  platform: 'test',
  obs: 'registry-smoke',
});
console.log('createCdp', created.id, created.port);

if (!getCdp(created.id) || !getCdp(tmpPort) || !getCdp('smoke-tmp')) {
  throw new Error('getCdp falhou');
}

const updated = updateCdp(created.id, { obs: 'updated' });
if (updated.obs !== 'updated') throw new Error('updateCdp falhou');

const st = await statusCdp(created.id);
console.log('statusCdp', st.status, st.cdpUrl);

const removed = removeCdp(created.id);
if (!removed || getCdp(created.id)) throw new Error('removeCdp falhou');

console.log('listCdps after', listCdps().length, '(before', before + ')');
console.log('ACEITE CRUD OK');
