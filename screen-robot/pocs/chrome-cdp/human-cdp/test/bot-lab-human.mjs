#!/usr/bin/env node
/**
 * Aceite: human-cdp vs bot-lab → veredito humano.
 *
 * Pré-req: Chrome Germano :9230 + ./serve.sh no bot-lab (:8766)
 *
 *   CDP_URL=http://127.0.0.1:9230 npm run test:bot-lab
 */
import { connect, sleep } from '../src/index.mjs';

const CDP = process.env.CDP_URL || 'http://127.0.0.1:9230';
const SITE = process.env.BOT_LAB_URL || 'http://127.0.0.1:8766/';

const session = await connect({
  cdpUrl: CDP,
  url: SITE,
  urlIncludes: '8766',
  focused: true,
});

const snapshot = async (label) => {
  const s = await session.evaluate(`({
    label: ${JSON.stringify(label)},
    verdict: document.getElementById('score-verdict')?.textContent?.trim(),
    meta: document.getElementById('score-meta')?.textContent?.trim(),
    trusted: document.getElementById('m-trusted')?.textContent?.trim(),
    points: document.getElementById('m-points')?.textContent?.trim(),
    clicks: document.getElementById('m-clicks')?.textContent?.trim(),
    focusNow: document.getElementById('m-focus')?.textContent?.trim(),
    behavior: [...document.querySelectorAll('#behavior-list li')].map((li) =>
      li.innerText.replace(/\\s+/g, ' ').trim(),
    ),
  })`);
  console.log(`\n======== ${label} ========`);
  console.log('veredicto:', s.verdict);
  console.log('meta:', s.meta);
  console.log('trusted / points / clicks / focus:', s.trusted, '/', s.points, '/', s.clicks, '/', s.focusNow);
  for (const b of s.behavior || []) console.log(' ·', b);
  return s;
};

await session.goto(SITE);
await sleep(400);
await session.click('#btn-reset');
await sleep(300);

// cliques humanos espaçados
await session.click('#btn-primary');
await sleep(220);
await session.click('#btn-primary');
await sleep(250);
await session.click('#btn-primary');
await sleep(200);
await session.click('#btn-secondary');
await sleep(200);

// drag
await session.drag('#drag-handle', { dx: 160, dy: 0 });
await sleep(400);

// digitar no form
await session.type('#input-nome', 'humano cdp', { clear: true });
await sleep(200);

const result = await snapshot('human-cdp no bot-lab');

session.close();

const ok = /humano/i.test(result.verdict || '');
console.log('\n======== ACEITE ========');
console.log(ok ? 'OK → humano' : `FALHA → ${result.verdict}`);
process.exitCode = ok ? 0 : 1;
