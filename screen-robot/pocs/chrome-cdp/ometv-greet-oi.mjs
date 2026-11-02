#!/usr/bin/env node
/**
 * Em cada ometv CDP: pessoa nova ("conexão estabelecida") → manda "oi" 1x.
 *
 *   node ometv-greet-oi.mjs
 *   IDS=ometv-1 MSG=oi node ometv-greet-oi.mjs
 */
import {
  connectCdp,
  ensureFingerprintKeeper,
  startCdp,
  getCdp,
  sleep,
} from './human-cdp/src/index.mjs';
import { execFileSync } from 'node:child_process';

const IDS = (process.env.IDS || 'ometv-1,ometv-2')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const MSG = process.env.MSG || 'oi';
const POLL_MS = Number(process.env.POLL_MS || 900);

function pages(port) {
  try {
    const out = execFileSync(
      'curl',
      ['-sS', '--max-time', '2', `http://127.0.0.1:${port}/json/list`],
      { encoding: 'utf8' },
    );
    return JSON.parse(out).filter((t) => t.type === 'page');
  } catch {
    return [];
  }
}

async function ensureUp(id) {
  const meta = getCdp(id);
  if (!meta?.port || !pages(meta.port).length) {
    await startCdp(id, { url: 'https://ome.tv/' });
  }
  ensureFingerprintKeeper(id);
}

function connectionKeyExpr() {
  return `(() => {
    const els = [...document.querySelectorAll('.connection-established-message')];
    if (!els.length) return null;
    const last = els[els.length - 1];
    const t = (last.innerText || '').replace(/\\s+/g, ' ').trim();
    return t || null;
  })()`;
}

async function sendOi(page, id) {
  await page.ensureFocus({ require: true });
  const ready = await page.evaluate(`!!document.querySelector('#chat-text')`);
  if (!ready) {
    console.log(new Date().toISOString(), id, 'sem #chat-text');
    return false;
  }
  await page.click('#chat-text');
  await sleep(150);
  await page.type('#chat-text', MSG, { clickFirst: false, clear: true });
  await sleep(100);
  await page.ensureFocus({ require: true });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  });
  console.log(new Date().toISOString(), id, `enviou "${MSG}"`);
  return true;
}

async function openSession(id) {
  await ensureUp(id);
  const page = await connectCdp(id, { debug: true });
  await page.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  return page;
}

async function watchOne(id) {
  let greeted = new Set();
  let page = null;

  while (true) {
    try {
      if (!page) {
        page = await openSession(id);
        const key0 = await page.evaluate(connectionKeyExpr());
        if (key0 && !greeted.has(key0)) {
          greeted.add(key0);
          console.log(new Date().toISOString(), id, 'conexão atual', key0.slice(0, 60));
          await sleep(350);
          await sendOi(page, id);
        } else {
          console.log(new Date().toISOString(), id, 'aguardando pessoa…');
        }
      }

      const key = await page.evaluate(connectionKeyExpr());
      if (key && !greeted.has(key)) {
        greeted.add(key);
        if (greeted.size > 50) greeted = new Set([key]);
        console.log(new Date().toISOString(), id, 'nova pessoa', key.slice(0, 60));
        await sleep(450);
        await sendOi(page, id);
      }
    } catch (err) {
      console.log(new Date().toISOString(), id, 'reconnect', String(err.message || err));
      try {
        page?.close?.();
      } catch {
        /* ignore */
      }
      page = null;
      await sleep(1500);
      continue;
    }
    await sleep(POLL_MS);
  }
}

process.on('uncaughtException', (e) => {
  console.error('uncaught', e);
});
process.on('unhandledRejection', (e) => {
  console.error('unhandled', e);
});

console.log('ometv-greet-oi', { IDS, MSG, POLL_MS });
await Promise.all(IDS.map((id) => watchOne(id)));
