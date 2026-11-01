#!/usr/bin/env node
/**
 * Atualiza banner (imagem de capa) LinkedIn via CDP com a imagem passada.
 *
 * Uso:
 *   CDP_URL=http://127.0.0.1:9228 node linkedin-update-banner-cdp.mjs --photo /caminho/banner.jpg
 *   node linkedin-update-banner-cdp.mjs --banner ./capa.png
 *
 * Fluxo PT-BR: /in/me → Adicionar/Editar imagem de fundo → Adicionar imagem de capa
 *   → Carregar foto → setFile → Salvar.
 * Cliques: Input.dispatchMouseEvent. Upload: DOM.setFileInputFiles.
 * Regra: se aparecer Pular, clica.
 */
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const CDP = process.env.CDP_URL || 'http://127.0.0.1:9224';
const PROFILE = process.env.LINKEDIN_PROFILE_URL || 'https://www.linkedin.com/in/me/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(...flags) {
  let found = '';
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    for (const flag of flags) {
      if (argv[i] === flag && argv[i + 1] && !String(argv[i + 1]).startsWith('-')) {
        found = argv[i + 1];
      } else if (String(argv[i]).startsWith(flag + '=')) {
        found = argv[i].slice(flag.length + 1);
      }
    }
  }
  return found;
}

const PHOTO = resolve(arg('--photo', '--foto', '--banner', '--capa'));
const USO = `uso: node linkedin-update-banner-cdp.mjs --photo /caminho/banner.jpg`;

async function json(path) {
  const r = await fetch(`${CDP}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

function session(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const ready = new Promise((ok, err) => {
    ws.addEventListener('open', ok);
    ws.addEventListener('error', err);
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id == null || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  });
  async function send(method, params = {}) {
    await ready;
    const i = ++id;
    return new Promise((resolve, reject) => {
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  }
  return { send, close: () => ws.close(), ready };
}

async function main() {
  if (!PHOTO || !existsSync(PHOTO)) {
    console.error(USO);
    if (PHOTO) console.error('arquivo inexistente:', PHOTO);
    process.exit(1);
  }
  console.log({ CDP, PHOTO, PROFILE });

  const pages = await json('/json/list');
  const page =
    pages.find((t) => t.type === 'page' && /linkedin\.com\/in\//.test(t.url || '')) ||
    pages.find(
      (t) =>
        t.type === 'page' &&
        /linkedin\.com/.test(t.url || '') &&
        !/login|chrome:\/\//.test(t.url || ''),
    ) ||
    pages.find((t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://'));
  if (!page?.webSocketDebuggerUrl) throw new Error(`sem pagina LinkedIn em ${CDP}`);

  const s = session(page.webSocketDebuggerUrl);
  await s.ready;
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  await s.send('DOM.enable');
  await s.send('Page.setInterceptFileChooserDialog', { enabled: true });
  await s.send('Page.bringToFront');

  const evalv = async (expression) => {
    const r = await s.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  };

  const clickXY = async (x, y) => {
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
  };

  const clickSkipIfAny = async () => {
    const sk = await evalv(`(() => {
      const hits = [...document.querySelectorAll('button,a,[role=button]')].map((e) => {
        if (!e.getClientRects().length) return null;
        const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
        if (!/^pular$|^skip$/i.test(t)) return null;
        const b = e.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return null;
        return { text: t, x: b.x + b.width / 2, y: b.y + b.height / 2, area: b.width * b.height };
      }).filter(Boolean);
      if (!hits.length) return null;
      hits.sort((a, b) => b.y - a.y || b.area - a.area);
      return hits[0];
    })()`);
    if (!sk) return false;
    console.log('click', sk.text);
    await clickXY(sk.x, sk.y);
    await sleep(1500);
    return true;
  };

  const clickText = async (text) => {
    const hit = await evalv(`(() => {
      const needle = ${JSON.stringify(text)};
      const el = [...document.querySelectorAll('button,a,[role=button],label,[role=menuitem]')].find(
        (e) => (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim() === needle,
      );
      if (!el || !el.getClientRects().length) return null;
      const b = el.getBoundingClientRect();
      return { text: needle, x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    if (!hit) {
      console.log('clickText miss', text);
      return false;
    }
    console.log('click', hit.text);
    await clickXY(hit.x, hit.y);
    return true;
  };

  const setLastFile = async (path) => {
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
  };

  const status = () =>
    evalv(`(() => ({
      href: location.href,
      bg: ([...document.querySelectorAll('img')].find((i) =>
        /background|banner|cover/i.test(i.currentSrc || i.src || ''),
      )?.currentSrc || '').slice(0, 140),
    }))()`);

  await s.send('Page.navigate', { url: PROFILE });
  await sleep(4000);
  await clickSkipIfAny();
  await evalv(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"]')]
    .forEach((e) => { try { e.click(); } catch {} }))`);
  await sleep(400);

  const cam = await evalv(`(() => {
    const el =
      document.querySelector('[aria-label="Adicionar imagem de fundo"]') ||
      document.querySelector('[aria-label="Editar imagem de fundo"]') ||
      document.querySelector('[aria-label="Add background image"]') ||
      document.querySelector('[aria-label="Edit background image"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, aria: el.getAttribute('aria-label') || '' };
  })()`);
  if (!cam) throw new Error('sem controle de imagem de fundo/capa');
  console.log('open capa', cam);
  await clickXY(cam.x, cam.y);
  await sleep(2500);
  await clickSkipIfAny();

  // Menu LI: <a> curto (não menuitem); retry + preferir label exato.
  let item = null;
  for (let attempt = 0; attempt < 4 && !item; attempt++) {
    item = await evalv(`(() => {
      const labels = [
        'Adicionar imagem de capa',
        'Alterar imagem de capa',
        'Editar imagem de capa',
        'Add cover image',
        'Change cover image',
        'Edit cover image',
      ];
      const cands = [...document.querySelectorAll('a,button,[role=menuitem],[role=button],div')]
        .map((e) => {
          const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
          if (!labels.some((l) => t === l || t.startsWith(l))) return null;
          const r = e.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.height > 80) return null;
          return {
            text: t.slice(0, 40),
            x: r.x + r.width / 2,
            y: r.y + r.height / 2,
            h: r.height,
            topish: r.y < 320,
            exact: labels.includes(t),
          };
        })
        .filter(Boolean);
      cands.sort((a, b) => Number(b.exact) - Number(a.exact) || a.h - b.h || a.y - b.y);
      return cands.filter((c) => c.topish)[0] || cands[0] || null;
    })()`);
    if (!item) await sleep(700);
  }
  if (item) {
    console.log('menu', item.text);
    await clickXY(item.x, item.y);
    await sleep(2500);
  } else {
    console.log('menu miss: Adicionar/Alterar imagem de capa');
  }

  // Capa existente: overlay Alterar/Editar → modal; nova: já no modal Carregar*.
  for (const t of ['Alterar foto', 'Change photo', 'Editar', 'Edit']) {
    if (await clickText(t)) {
      await sleep(1500);
      break;
    }
  }
  for (const t of [
    'Carregar foto única',
    'Selecionar imagem',
    'Carregar foto',
    'Carregar',
    'Upload photo',
    'Upload single photo',
  ]) {
    if (await clickText(t)) break;
  }
  await sleep(800);
  await setLastFile(PHOTO);
  await sleep(3000);
  if (!(await clickText('Salvar alterações'))) {
    if (!(await clickText('Salvar'))) await clickText('Save');
  }
  await sleep(6000);
  await clickSkipIfAny();

  await s.send('Page.navigate', { url: PROFILE });
  await sleep(3500);
  const st = await status();
  console.log('FINAL', st);
  if (!st.bg) {
    console.error('FALHOU: banner nao detectado apos upload');
    process.exitCode = 2;
  } else {
    console.log('OK banner atualizado');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
