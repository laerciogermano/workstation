#!/usr/bin/env node
/**
 * Aceite: connect({ debug: true }) no bot-lab → fig-mouse + painel fixo à direita (minimizável).
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
  mouseOn: !!document.getElementById('fig-mouse')?.classList.contains('is-on'),
  railFixed: !!document.querySelector('.feedback-rail'),
  railMinimizable: !!document.getElementById('btn-rail-toggle'),
  floating: !!document.querySelector('.feedback-rail.human-cdp-debug-float'),
  floatTransform: document.querySelector('.feedback-rail')?.style?.transform || '',
})`);

await on.evaluate(`document.getElementById('btn-rail-toggle')?.click()`);
await sleep(100);
const minSnap = await on.evaluate(`({
  minimized: !!document.querySelector('.feedback-rail.is-minimized'),
  shellMin: !!document.querySelector('.shell.rail-minimized'),
})`);
on.close();

console.log('debug=false:', offSnap);
console.log('debug=true:', onSnap);
console.log('minimizado:', minSnap);

const ok =
  offSnap.enabled === false &&
  offSnap.floating === false &&
  onSnap.enabled === true &&
  onSnap.isBotLab === true &&
  onSnap.mouseOn === true &&
  onSnap.railFixed === true &&
  onSnap.railMinimizable === true &&
  onSnap.floating === false &&
  !onSnap.floatTransform &&
  minSnap.minimized === true &&
  minSnap.shellMin === true;

console.log(ok ? 'OK → mouse + painel fixo minimizável' : 'FALHA → debug overlay');
process.exitCode = ok ? 0 : 1;
