#!/usr/bin/env node
/**
 * Configura a secao Sobre (About / summary) do LinkedIn via CDP.
 *
 * Base (LinkedIn Help a540837 / a553140 + notas CDP SPA):
 *   1. Perfil (/in/me)
 *   2. Sem Sobre: "Adicionar seção" → "Adicionar seção Sobre"
 *      (href .../edit/forms/summary/new/) — CLICAR o <a>, nao Page.navigate
 *      (Page.navigate na URL do form NAO hidrata o editor)
 *   3. Com Sobre: lapis "Editar" na secao Sobre → popup "Editar sobre"
 *   4. Campo contenteditable (ate 2600 chars) → Salvar
 *
 * Uso:
 *   CDP_URL=http://127.0.0.1:9228 node linkedin-setup-about-cdp.mjs --about "Texto..."
 *   node linkedin-setup-about-cdp.mjs   # assets/profile-defaults.json
 *
 * Cliques: Input.dispatchMouseEvent (+ DOM click no ancora SPA). Digita: Input.insertText.
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
const ABOUT_MAX = 2600;
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

const ABOUT = (arg('--about', '--sobre', '--text', '--texto') || loadDefaultAbout())
  .trim()
  .slice(0, ABOUT_MAX);
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
  console.log({ CDP, PROFILE, aboutLen: ABOUT.length, max: ABOUT_MAX });

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
    await sleep(1200);
    return true;
  };

  /** Clique SPA: DOM click no ancora (hidrata form); fallback mouse. */
  const clickAnchorHref = async (hrefRe) =>
    evalv(`(() => {
      const re = new RegExp(${JSON.stringify(hrefRe)}, 'i');
      const el = [...document.querySelectorAll('a[href]')].find((e) => {
        if (!e.getClientRects().length) return false;
        return re.test(e.getAttribute('href') || '');
      });
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      el.click();
      const b = el.getBoundingClientRect();
      return {
        text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        href: el.getAttribute('href') || '',
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
      };
    })()`);

  const clickTextPreferLower = async (reSrc) => {
    const hit = await evalv(`(() => {
      const re = new RegExp(${JSON.stringify(reSrc)}, 'i');
      const hits = [...document.querySelectorAll('button,a,[role=button],[role=menuitem]')].map((e) => {
        if (!e.getClientRects().length) return null;
        const text = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
        if (!re.test(text)) return null;
        const b = e.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return null;
        return { text: text.slice(0, 80), x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }).filter(Boolean);
      if (!hits.length) return null;
      hits.sort((a, b) => b.y - a.y);
      return hits[0];
    })()`);
    if (!hit) return false;
    console.log('click', hit.text, `@${Math.round(hit.y)}`);
    await clickXY(hit.x, hit.y);
    return true;
  };

  const findAboutEditor = async () =>
    evalv(`(() => {
      const areas = [...document.querySelectorAll(
        'textarea,[contenteditable=true],div[role=textbox],[contenteditable=""]',
      )].filter((e) => e.getClientRects().length);
      const pick =
        areas.find((e) =>
          /sobre|about|summary|resumo/i.test(
            (e.getAttribute('aria-label') || '') + ' ' + (e.id || '') + ' ' + (e.className || ''),
          ),
        ) ||
        areas.find((e) => {
          const b = e.getBoundingClientRect();
          return b.height > 50 && b.width > 180;
        }) ||
        areas[0];
      if (!pick) return null;
      const b = pick.getBoundingClientRect();
      return {
        tag: pick.tagName,
        aria: pick.getAttribute('aria-label') || '',
        contentEditable: pick.getAttribute('contenteditable') || '',
        x: b.x + b.width / 2,
        y: b.y + Math.min(40, b.height / 2),
      };
    })()`);

  const waitEditor = async (tries = 15) => {
    for (let i = 0; i < tries; i++) {
      const ed = await findAboutEditor();
      if (ed) return ed;
      await sleep(800);
    }
    return null;
  };

  // 1) perfil
  await s.send('Page.navigate', { url: PROFILE });
  await sleep(4500);
  await clickSkipIfAny();
  await evalv(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"]')]
    .forEach((e) => { try { e.click(); } catch {} }))`);
  await sleep(400);

  // 2a) se ja existe Sobre com lapis
  let opened = false;
  const pencil = await evalv(`(() => {
    const sec = [...document.querySelectorAll('section')].find((e) => {
      const h = e.querySelector('h2,h3');
      return h && /^sobre$|^about$/i.test((h.innerText || '').trim());
    });
    if (!sec) return null;
    const btn = [...sec.querySelectorAll('button,a')].find((e) =>
      /editar|edit/i.test(e.getAttribute('aria-label') || e.innerText || ''),
    );
    if (!btn || !btn.getClientRects().length) return null;
    const b = btn.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, aria: btn.getAttribute('aria-label') || 'Editar' };
  })()`);
  if (pencil) {
    console.log('click', pencil.aria);
    await clickXY(pencil.x, pencil.y);
    opened = true;
  }

  // 2b) Adicionar seção (corpo do perfil) → ancora /edit/forms/summary/new/
  if (!opened || !(await findAboutEditor())) {
    if (await clickTextPreferLower('^adicionar se[cç][aã]o$|^add (profile )?section$')) {
      await sleep(1800);
      // ancora SPA — DOM click (nao Page.navigate)
      let hit = await clickAnchorHref('/edit/forms/summary/new');
      if (!hit) {
        hit = await evalv(`(() => {
          const el = [...document.querySelectorAll('a,button,[role=menuitem]')].find((e) => {
            if (!e.getClientRects().length) return false;
            const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
            return /adicionar se[cç][aã]o sobre|add about/i.test(t);
          });
          if (!el) return null;
          el.click();
          const b = el.getBoundingClientRect();
          return {
            text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
            href: el.getAttribute('href') || '',
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
          };
        })()`);
      }
      if (hit) {
        console.log('spa-click', hit.text || hit.href);
        // reforca com mouse trusted se ancora ainda na tela
        if (hit.x && hit.y) await clickXY(hit.x, hit.y);
        opened = true;
      }
    }
  }

  const editor = await waitEditor();
  if (!editor) {
    console.error('FALHOU: editor Sobre nao hidratou (precisa clique SPA no ancora summary/new)');
    const st = await evalv(
      `({href:location.href,body:(document.body?.innerText||'').replace(/\\s+/g,' ').slice(0,300)})`,
    );
    console.log('state', st);
    process.exitCode = 2;
    s.close();
    return;
  }
  console.log('editor', editor);

  // 3) limpa + cola (contenteditable / ProseMirror)
  await clickXY(editor.x, editor.y);
  await sleep(300);
  await evalv(`(() => {
    const el = document.querySelector('[contenteditable=true],textarea,div[role=textbox]');
    if (!el) return false;
    el.focus();
    if (el.tagName === 'TEXTAREA') {
      el.select();
      return true;
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  })()`);
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
  await sleep(600);

  // 4) Salvar
  const saved = await evalv(`(() => {
    const re = /^(salvar|save)$/i;
    const el = [...document.querySelectorAll('button')].find((e) => {
      if (!e.getClientRects().length) return false;
      return re.test((e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim());
    });
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { text: (el.innerText || '').trim(), x: b.x + b.width / 2, y: b.y + b.height / 2 };
  })()`);
  if (!saved) throw new Error('botao Salvar ausente');
  console.log('click', saved.text);
  await clickXY(saved.x, saved.y);
  await sleep(4500);
  await clickSkipIfAny();

  // 5) verifica no perfil
  await s.send('Page.navigate', { url: PROFILE });
  await sleep(4000);
  const check = await evalv(`(() => {
    const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
    const snippet = ${JSON.stringify(ABOUT.slice(0, 40))};
    return {
      href: location.href,
      hasSnippet: body.includes(snippet),
      aboutHead: (body.match(/Sobre[\\s\\S]{0,220}/) || [''])[0].slice(0, 200),
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
