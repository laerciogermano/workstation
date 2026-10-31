#!/usr/bin/env node
/**
 * LinkedIn web (CDP :9223): avatar ConectMax, depois banner.
 *
 * Uso:
 *   CDP_URL=http://127.0.0.1:9223 node setup-avatar-banner.mjs
 *   node setup-avatar-banner.mjs --avatar-only
 *   node setup-avatar-banner.mjs --banner-only
 *
 * Fluxo web PT-BR:
 * - Avatar (já tem foto): canto da "Foto do perfil" → Editar → Atualizar → Carregar foto → setFile → Salvar alterações
 * - Banner: câmera "Adicionar imagem de fundo" → menuitem "Adicionar imagem de capa" → Carregar foto única → setFile → Salvar alterações
 *
 * Assets: src/assets/avatars/conectmax-black.jpg + banners/conectmax-banner.jpg
 * Rollback: editar/excluir mídia no próprio LinkedIn; omitir flags *-only.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dir, '../../src');
const AVATAR = resolve(SRC, 'assets/avatars/conectmax-black.jpg');
const BANNER = resolve(SRC, 'assets/banners/conectmax-banner.jpg');
const CDP_BASE = process.env.CDP_URL || 'http://127.0.0.1:9223';
const PROFILE =
  process.env.LINKEDIN_PROFILE_URL ||
  'https://www.linkedin.com/in/me/';
const args = new Set(process.argv.slice(2));
const AVATAR_ONLY = args.has('--avatar-only');
const BANNER_ONLY = args.has('--banner-only');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path) {
  const res = await fetch(`${CDP_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

function cdpSession(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  const ready = new Promise((resolveReady, reject) => {
    ws.addEventListener('open', resolveReady);
    ws.addEventListener('error', reject);
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve: res, reject: rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(JSON.stringify(msg.error)));
      else res(msg.result);
    }
  });
  async function send(method, params = {}) {
    await ready;
    const id = ++nextId;
    return new Promise((res, rej) => {
      pending.set(id, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  return { send, close: () => ws.close(), ready };
}

async function main() {
  const targets = await getJson('/json/list');
  const page =
    targets.find((t) => t.type === 'page' && /linkedin\.com\/in\//.test(t.url)) ||
    targets.find(
      (t) => t.type === 'page' && /linkedin\.com/.test(t.url) && !/login/.test(t.url),
    );
  if (!page?.webSocketDebuggerUrl) throw new Error('sem aba LinkedIn no CDP');

  console.log('tab', page.title, page.url);
  const s = cdpSession(page.webSocketDebuggerUrl);
  await s.ready;
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  await s.send('DOM.enable');
  await s.send('Page.setInterceptFileChooserDialog', { enabled: true });

  async function evalv(expression) {
    const r = await s.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  }

  async function mouseClick(x, y) {
    await s.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await s.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
  }

  async function clickText(text) {
    const ok = await evalv(`(() => {
      const needle = ${JSON.stringify(text)};
      const el = [...document.querySelectorAll('button,a,[role=button],label,[role=menuitem]')].find(
        (e) => (e.innerText || '').replace(/\\s+/g, ' ').trim() === needle,
      );
      if (!el) return false;
      el.click();
      return true;
    })()`);
    console.log('clickText', text, ok);
    return ok;
  }

  async function setLastFile(path) {
    const doc = await s.send('DOM.getDocument', { depth: -1 });
    const { nodeIds } = await s.send('DOM.querySelectorAll', {
      nodeId: doc.root.nodeId,
      selector: 'input[type=file]',
    });
    if (!nodeIds?.length) throw new Error('sem input[type=file]');
    await s.send('DOM.setFileInputFiles', {
      files: [path],
      nodeId: nodeIds[nodeIds.length - 1],
    });
    console.log('setFile', path.split('/').pop());
  }

  async function goProfile() {
    await s.send('Page.navigate', { url: PROFILE });
    await sleep(4000);
    await evalv(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"]')]
      .forEach((e) => { try { e.click(); } catch {} }))`);
    await sleep(400);
  }

  async function status() {
    return evalv(`(() => {
      const labels = [...document.querySelectorAll('[aria-label]')]
        .map((e) => e.getAttribute('aria-label'))
        .filter((a) => /foto|fundo|capa|photo|cover|background/i.test(a));
      const photo = [...document.querySelectorAll('img')].find(
        (i) =>
          i.getBoundingClientRect().width > 100 &&
          /profile-displayphoto/.test(i.currentSrc || i.src || ''),
      );
      const bg = [...document.querySelectorAll('img')].find((i) =>
        /background|banner|cover/i.test(i.currentSrc || i.src || ''),
      );
      return {
        href: location.href,
        labels,
        photo: (photo?.currentSrc || '').slice(0, 120),
        bg: (bg?.currentSrc || '').slice(0, 120),
      };
    })()`);
  }

  if (!BANNER_ONLY) {
    console.log('\n=== AVATAR ===');
    await goProfile();
    const corner = await evalv(`(() => {
      const el = document.querySelector('[aria-label="Foto do perfil"], [aria-label="Adicionar foto"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width - 8, y: r.y + r.height - 8, aria: el.getAttribute('aria-label') };
    })()`);
    if (!corner) throw new Error('sem controle de foto');
    console.log('open photo', corner);
    await mouseClick(corner.x, corner.y);
    await sleep(1200);

    if (corner.aria === 'Adicionar foto' || !(await clickText('Editar'))) {
      await clickText('Carregar foto');
    } else {
      await sleep(1500);
      await clickText('Atualizar');
      await sleep(1000);
      await clickText('Carregar foto');
    }
    await sleep(800);
    await setLastFile(AVATAR);
    await sleep(3000);
    if (!(await clickText('Salvar alterações'))) await clickText('Salvar');
    await sleep(6000);
    console.log('depois avatar', await status());
  }

  if (AVATAR_ONLY) {
    s.close();
    return;
  }

  console.log('\n=== BANNER ===');
  await goProfile();
  const cam = await evalv(`(() => {
    const el =
      document.querySelector('[aria-label="Adicionar imagem de fundo"]') ||
      document.querySelector('[aria-label="Editar imagem de fundo"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, aria: el.getAttribute('aria-label') };
  })()`);
  if (!cam) throw new Error('sem câmera de capa');
  console.log('open capa', cam);
  await mouseClick(cam.x, cam.y);
  await sleep(1500);

  const item = await evalv(`(() => {
    const cands = [...document.querySelectorAll('a[role=menuitem],button,a,div')]
      .filter((e) => (e.innerText || '').replace(/\\s+/g, ' ').trim() === 'Adicionar imagem de capa'
        || (e.innerText || '').replace(/\\s+/g, ' ').trim() === 'Alterar imagem de capa')
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          role: e.getAttribute('role'),
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          w: r.width,
          h: r.height,
          topish: r.y < 250,
        };
      })
      .filter((c) => c.w > 0 && c.h > 0 && c.h < 60);
    return cands.filter((c) => c.topish).sort((a, b) => a.y - b.y)[0] || cands[0] || null;
  })()`);
  if (item) {
    console.log('menu item', item);
    await mouseClick(item.x, item.y);
    await sleep(2000);
  }

  for (const t of ['Carregar foto única', 'Carregar foto', 'Carregar']) {
    if (await clickText(t)) break;
  }
  await sleep(800);
  await setLastFile(BANNER);
  await sleep(3000);
  if (!(await clickText('Salvar alterações'))) await clickText('Salvar');
  await sleep(6000);
  await goProfile();
  console.log('depois banner', await status());
  s.close();
}

main().catch((err) => {
  console.error('Falha:', err.message || err);
  process.exit(1);
});
