#!/usr/bin/env node
/**
 * Aceite: connect({ debug: true }) no bot-lab → feedback-rail flutuante junto ao mouse.
 *
 * Pré-req: Chrome :9230 + bot-lab :8766
 *
 *   CDP_URL=http://127.0.0.1:9230 npm run test:debug
 */
import { connect, sleep } from '../src/index.mjs';

const CDP = process.env.CDP_URL || 'http://127.0.0.1:9230';
const SITE = process.env.BOT_LAB_URL || 'http://127.0.0.1:8766/';

const off = await connect({
  cdpUrl: CDP,
  url: SITE,
  urlIncludes: '8766',
  debug: false,
});
const offSnap = await off.evaluate(`({
  enabled: !!window.__humanCdpDebug?.enabled,
  floating: !!document.querySelector('.feedback-rail.human-cdp-debug-float'),
})`);
off.close();

const on = await connect({
  cdpUrl: CDP,
  url: SITE,
  urlIncludes: '8766',
  debug: true,
});
await sleep(300);
await on.click('#btn-primary');
await sleep(200);

const onSnap = await on.evaluate(`({
  enabled: !!window.__humanCdpDebug?.enabled,
  isBotLab: !!window.__humanCdpDebug?.isBotLab,
  floating: !!document.querySelector('.feedback-rail.human-cdp-debug-float'),
  transform: document.querySelector('.feedback-rail')?.style?.transform || '',
  shell: !!document.querySelector('.shell.human-cdp-debug-shell'),
})`);
on.close();

console.log('debug=false:', offSnap);
console.log('debug=true:', onSnap);

const ok =
  offSnap.enabled === false &&
  offSnap.floating === false &&
  onSnap.enabled === true &&
  onSnap.isBotLab === true &&
  onSnap.floating === true &&
  onSnap.shell === true &&
  /translate\(/.test(onSnap.transform || '');

console.log(ok ? 'OK → overlay debug junto ao mouse' : 'FALHA → overlay debug');
process.exitCode = ok ? 0 : 1;
