#!/usr/bin/env node
/**
 * Um passo por execução (Chrome em foco) para observar.
 *
 *   CDP_URL=http://127.0.0.1:9230 node examples/observe-step.mjs <passo>
 *
 * Passos: open | reset | primary | primary2 | secondary | drag | type | verdict | all
 */
import { connect, sleep } from '../src/index.mjs';

const step = process.argv[2] || 'verdict';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9230';
const SITE = process.env.BOT_LAB_URL || 'http://127.0.0.1:8766/';

const session = await connect({
  cdpUrl: CDP,
  urlIncludes: '8766',
  focused: true,
});

await session.bringToFront();

const show = async () => {
  const s = await session.evaluate(`({
    verdict: document.getElementById('score-verdict')?.textContent?.trim(),
    meta: document.getElementById('score-meta')?.textContent?.trim(),
  })`);
  console.log('veredicto:', s.verdict, '|', s.meta);
};

switch (step) {
  case 'open':
    await session.goto(SITE);
    console.log('open →', SITE);
    break;
  case 'reset':
    await session.click('#btn-reset');
    console.log('reset');
    break;
  case 'primary':
  case 'primary2':
    await session.click('#btn-primary');
    console.log('click #btn-primary');
    break;
  case 'secondary':
    await session.click('#btn-secondary');
    console.log('click #btn-secondary');
    break;
  case 'drag':
    await session.drag('#drag-handle', { dx: 160 });
    console.log('drag #drag-handle +160');
    break;
  case 'type':
    await session.type('#input-nome', 'observando lib', { clear: true });
    console.log('type #input-nome');
    break;
  case 'verdict':
    await show();
    break;
  case 'all':
    await session.goto(SITE);
    await sleep(800);
    await session.click('#btn-reset');
    await sleep(800);
    await session.click('#btn-primary');
    await sleep(800);
    await session.click('#btn-primary');
    await sleep(800);
    await session.click('#btn-secondary');
    await sleep(800);
    await session.drag('#drag-handle', { dx: 160 });
    await sleep(800);
    await session.type('#input-nome', 'observando lib', { clear: true });
    await sleep(400);
    await show();
    break;
  default:
    console.error('passo inválido:', step);
    process.exitCode = 1;
}

if (step !== 'verdict' && step !== 'all') await show();
await sleep(500);
session.close();
