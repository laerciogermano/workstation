#!/usr/bin/env node
/**
 * Em cada ometv CDP: quando aparece pessoa nova (mensagem "conexão estabelecida"),
 * manda "oi" uma vez via #chat-text + Enter.
 *
 *   node ometv-greet-oi.mjs
 *   IDS=ometv-1,ometv-2 MSG=oi node ometv-greet-oi.mjs
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
  // input de chat
  const ready = await page.evaluate(`!!document.querySelector('#chat-text')`);
  if (!ready) {
    console.log(new Date().toISOString(), id, 'sem #chat-text');
    return false;
  }
  await page.click('#chat-text');
  await sleep(120);
  await page.type('#chat-text', MSG, { clickFirst: false, clear: true });
  await sleep(80);
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

async function watchOne(id) {
  await ensureUp(id);
  const page = await connectCdp(id, { debug: true });
  await page.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  let lastKey = await page.evaluate(connectionKeyExpr());
  let greeted = new Set(lastKey ? [lastKey] : []);
  // se já tem conexão aberta e ainda não cumprimentou nesta sessão, manda oi
  if (lastKey) {
    console.log(new Date().toISOString(), id, 'conexão atual', lastKey.slice(0, 60));
    await sendOi(page, id);
  } else {
    console.log(new Date().toISOString(), id, 'aguardando pessoa…');
  }

  while (true) {
    try {
      const key = await page.evaluate(connectionKeyExpr());
      if (key && !greeted.has(key)) {
        greeted.add(key);
        // limpa set se crescer demais
        if (greeted.size > 40) {
          greeted = new Set([key]);
        }
        console.log(new Date().toISOString(), id, 'nova pessoa', key.slice(0, 60));
        await sleep(400); // deixa UI estabilizar
        await sendOi(page, id);
      }
      lastKey = key;
    } catch (err) {
      console.log(new Date().toISOString(), id, 'erro', String(err.message || err));
      await sleep(1500);
      try {
        await ensureUp(id);
      } catch {
        /* ignore */
      }
    }
    await sleep(POLL_MS);
  }
}

console.log('ometv-greet-oi', { IDS, MSG, POLL_MS });
await Promise.all(IDS.map((id) => watchOne(id)));
