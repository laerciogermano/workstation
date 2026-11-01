#!/usr/bin/env node
/**
 * Configura a secao Sobre (about/summary) do LinkedIn via CDP.
 *
 * Uso:
 *   CDP_URL=http://127.0.0.1:9228 node linkedin-setup-about-cdp.mjs --about "Texto..."
 *   node linkedin-setup-about-cdp.mjs   # usa assets/profile-defaults.json (about)
 *
 * Fluxo PT-BR: /in/me → Adicionar secao/resumo/Sobre (ou Editar Sobre) → cola texto → Salvar.
 * Cliques: Input.dispatchMouseEvent. Digita: Input.insertText.
 * Regra: se aparecer Pular, clica.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9224';
const PROFILE = process.env.LINKEDIN_PROFILE_URL || 'https://www.linkedin.com/in/me/';
const DEFAULTS = resolve(__dir, '../../src/assets/profile-defaults.json');
const FALLBACK_ABOUT =
  'A ConectMax chegou para facilitar o processo de compras da sua empresa, temos uma imensa variedade de produtos desde materiais básicos para o dia a dia até os itens mais atuais da tecnologia!';
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

function loadDefaultAbout() {
  try {
    if (!existsSync(DEFAULTS)) return FALLBACK_ABOUT;
    const j = JSON.parse(readFileSync(DEFAULTS, 'utf8'));
    return String(j.about || '').trim() || FALLBACK_ABOUT;
  } catch {
    return FALLBACK_ABOUT;
  }
}

const ABOUT = (arg('--about', '--sobre', '--text', '--texto') || loadDefaultAbout()).trim();
const USO = `uso: node linkedin-setup-about-cdp.mjs --about "Texto da secao Sobre"`;

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
  if (!ABOUT) {
    console.error(USO);
    process.exit(1);
  }
  console.log({ CDP, PROFILE, aboutLen: ABOUT.length });

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

  const clickRe = async (reSrc) => {
    const hit = await evalv(`(() => {
      const re = new RegExp(${JSON.stringify(reSrc)}, 'i');
      const el = [...document.querySelectorAll('button,a,[role=button],label,[role=menuitem]')].find((e) => {
        if (!e.getClientRects().length) return false;
        return re.test((e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim());
      });
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
      };
    })()`);
    if (!hit) return false;
    console.log('click', hit.text);
    await clickXY(hit.x, hit.y);
    return true;
  };

  const findAboutEditor = async () =>
    evalv(`(() => {
      const areas = [...document.querySelectorAll('textarea,[contenteditable=true],div[role=textbox]')].filter(
        (e) => e.getClientRects().length,
      );
      const pick =
        areas.find((e) => /sobre|about|summary|resumo/i.test(
          (e.getAttribute('aria-label') || '') + ' ' + (e.id || '') + ' ' + (e.name || ''),
        )) ||
        areas.find((e) => {
          const b = e.getBoundingClientRect();
          return b.height > 60 && b.width > 200;
        }) ||
        areas[0];
      if (!pick) return null;
      const b = pick.getBoundingClientRect();
      return {
        tag: pick.tagName,
        aria: pick.getAttribute('aria-label') || '',
        x: b.x + b.width / 2,
        y: b.y + Math.min(40, b.height / 2),
      };
    })()`);

  await s.send('Page.navigate', { url: PROFILE });
  await sleep(4000);
  await clickSkipIfAny();
  await evalv(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"]')]
    .forEach((e) => { try { e.click(); } catch {} }))`);
  await sleep(400);

  // tenta abrir editor Sobre
  let opened = false;
  for (const step of [
    async () => clickRe('^editar sobre$|^edit about$|^editar resumo$'),
    async () => {
      const pencil = await evalv(`(() => {
        const sec = [...document.querySelectorAll('section,div')].find((e) => {
          const h = e.querySelector('h2,h3');
          return h && /^sobre$|^about$|^resumo$|^summary$/i.test((h.innerText || '').trim());
        });
        if (!sec) return null;
        const btn = sec.querySelector('button[aria-label*="Editar"],button[aria-label*="Edit"],a[aria-label*="Editar"]');
        if (!btn || !btn.getClientRects().length) return null;
        const b = btn.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2, aria: btn.getAttribute('aria-label') || '' };
      })()`);
      if (!pencil) return false;
      console.log('click', pencil.aria || 'editar secao Sobre');
      await clickXY(pencil.x, pencil.y);
      return true;
    },
    async () => clickRe('adicionar (um )?resumo|add a summary|adicionar sobre'),
    async () => {
      if (!(await clickRe('adicionar se[cç][aã]o|add section'))) return false;
      await sleep(1200);
      return clickRe('^sobre$|^about$|^resumo$|^summary$');
    },
  ]) {
    if (await step()) {
      opened = true;
      await sleep(2000);
      if (await findAboutEditor()) break;
    }
  }

  let editor = await findAboutEditor();
  if (!editor && !opened) {
    // deep link edit about
    console.log('nav overlay about');
    await s.send('Page.navigate', {
      url: 'https://www.linkedin.com/in/me/edit/forms/summary/new/?profileFormEntryPoint=PROFILE_SECTION',
    });
    await sleep(3500);
    editor = await findAboutEditor();
  }
  if (!editor) editor = await findAboutEditor();
  if (!editor) throw new Error('editor Sobre nao encontrado');

  console.log('editor', editor);
  await clickXY(editor.x, editor.y);
  await sleep(300);
  // seleciona tudo e substitui
  await s.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    modifiers: 4,
    key: 'a',
    code: 'KeyA',
    windowsVirtualKeyCode: 65,
  });
  await s.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    modifiers: 4,
    key: 'a',
    code: 'KeyA',
    windowsVirtualKeyCode: 65,
  });
  await sleep(100);
  await s.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8,
  });
  await s.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8,
  });
  await s.send('Input.insertText', { text: ABOUT });
  console.log('about pasted', ABOUT.length);
  await sleep(500);

  if (!(await clickRe('^salvar$|^save$'))) {
    if (!(await clickRe('salvar altera|save changes'))) throw new Error('botao Salvar ausente');
  }
  await sleep(4000);
  await clickSkipIfAny();

  await s.send('Page.navigate', { url: PROFILE });
  await sleep(3500);
  const check = await evalv(`(() => {
    const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
    const snippet = ${JSON.stringify(ABOUT.slice(0, 48))};
    return {
      href: location.href,
      hasSnippet: body.includes(snippet),
      aboutHead: (body.match(/Sobre[\\s\\S]{0,200}/) || [''])[0].slice(0, 180),
    };
  })()`);
  console.log('FINAL', check);
  if (!check.hasSnippet) {
    console.error('FALHOU: texto Sobre nao apareceu no perfil');
    process.exitCode = 2;
  } else {
    console.log('OK about configurado');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
