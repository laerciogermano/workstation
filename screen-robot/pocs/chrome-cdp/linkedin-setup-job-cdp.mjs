#!/usr/bin/env node
/**
 * Configura cargo + empresa (experiencia / headline) do LinkedIn via CDP.
 *
 * Fluxo (perfil logado):
 *   1. /in/me — se ja tem o cargo (e empresa), OK skip (salvo --force)
 *   2. Abre form experiencia via SPA click em a[href*="/edit/forms/position"]
 *      (Adicionar secao → Experiencia se preciso). Page.navigate NAO hidrata.
 *   3. Typeahead Cargo + Empresa → marca "cargo atual" se existir → Salvar
 *   4. Verifica no perfil
 *
 * Uso:
 *   CDP_URL=http://127.0.0.1:9224 node linkedin-setup-job-cdp.mjs
 *   CDP_URL=… node linkedin-setup-job-cdp.mjs --job "…" --company ConectMax
 *   CDP_URL=… node linkedin-setup-job-cdp.mjs --force
 *
 * Defaults: src/assets/profile-defaults.json
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
const FALLBACK_JOB = 'Especialista em suprimentos e itens corporativos';
const FALLBACK_COMPANY = 'ConectMax';
const FORCE = process.argv.includes('--force');
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

function loadDefaults() {
  try {
    if (!existsSync(DEFAULTS)) return { jobTitle: FALLBACK_JOB, company: FALLBACK_COMPANY };
    const j = JSON.parse(readFileSync(DEFAULTS, 'utf8'));
    return {
      jobTitle: String(j.jobTitle || '').trim() || FALLBACK_JOB,
      company: String(j.company || '').trim() || FALLBACK_COMPANY,
    };
  } catch {
    return { jobTitle: FALLBACK_JOB, company: FALLBACK_COMPANY };
  }
}

const d = loadDefaults();
const JOB = (arg('--job', '--cargo', '--title') || d.jobTitle).trim();
const COMPANY = (arg('--company', '--empresa') || d.company).trim();
const USO = `uso: node linkedin-setup-job-cdp.mjs [--job "Cargo"] [--company "Empresa"] [--force]`;

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
  if (!JOB || !COMPANY) {
    console.error(USO);
    process.exit(1);
  }
  console.log({ CDP, PROFILE, JOB, COMPANY, FORCE });

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

  const typeahead = async (text, hintRe) => {
    const box = await evalv(`(() => {
      const re = new RegExp(${JSON.stringify(hintRe)}, 'i');
      const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),input[role=combobox]')]
        .filter((e) => e.getClientRects().length)
        // ignora busca global do header
        .filter((e) => !/^pesquisar$|^search$/i.test((e.placeholder || e.getAttribute('aria-label') || '').trim()));
      const el =
        inputs.find((e) =>
          re.test(
            (e.getAttribute('aria-label') || '') +
              ' ' +
              (e.placeholder || '') +
              ' ' +
              (e.name || '') +
              ' ' +
              (e.id || ''),
          ),
        ) || null;
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2, aria: el.getAttribute('aria-label') || el.placeholder || '' };
    })()`);
    if (!box) throw new Error('typeahead input: ' + hintRe);
    console.log('typeahead', box.aria || hintRe, '←', text);
    await clickXY(box.x, box.y);
    await s.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 3,
    });
    await s.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 3,
    });
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
    const typed = text.split(',')[0].trim();
    await s.send('Input.insertText', { text: typed });
    await sleep(2500);
    const first = typed.toLowerCase();
    const pick = await evalv(`(() => {
      const first = ${JSON.stringify(first)};
      const full = ${JSON.stringify(text.trim().toLowerCase())};
      const opts = [...document.querySelectorAll('[role=option],.basic-typeahead__selectable')].map((el) => {
        const b = el.getBoundingClientRect();
        const t = (el.innerText || '').replace(/\\s+/g, ' ').trim();
        return t && b.width > 1 ? { text: t, x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
      }).filter(Boolean);
      const chosen =
        opts.find((o) => o.text.toLowerCase() === full) ||
        opts.find((o) => o.text.toLowerCase() === first) ||
        opts.find((o) => o.text.toLowerCase().startsWith(first + ',')) ||
        opts.find((o) => o.text.toLowerCase().startsWith(first + ' ')) ||
        opts.find((o) => o.text.toLowerCase().includes(first)) ||
        opts[0];
      return { chosen, sample: opts.slice(0, 5).map((o) => o.text) };
    })()`);
    console.log('opts', pick.sample);
    if (pick.chosen) {
      console.log('pick', pick.chosen.text);
      await clickXY(pick.chosen.x, pick.chosen.y);
      await sleep(600);
    } else {
      console.log('typeahead sem sugestao — mantem texto digitado');
      await sleep(400);
    }
  };

  const waitPositionForm = async (tries = 25) => {
    for (let i = 0; i < tries; i++) {
      const st = await evalv(`(() => {
        const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
        const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),input[role=combobox]')]
          .filter((e) => e.getClientRects().length)
          .filter((e) => !/^pesquisar$|^search$/i.test((e.placeholder || e.getAttribute('aria-label') || '').trim()))
          .map((e) => ({
            aria: ((e.getAttribute('aria-label') || '') + ' ' + (e.placeholder || '') + ' ' + (e.name || '')).trim(),
          }));
        // LI web: placeholder "Exemplo: gerente de produtos…" / "Exemplo: Microsoft" (sem aria cargo)
        const hasJob = inputs.some((inp) =>
          /cargo|title|job|fun[cç][aã]o|gerente de produtos|exemplo:\\s*gerente/i.test(inp.aria),
        ) || /cargo\\*/i.test(body);
        const hasCo = inputs.some((inp) =>
          /empresa|company|empregador|employer|organiza|exemplo:\\s*microsoft/i.test(inp.aria),
        ) || /organiza[cç][aã]o\\/empresa|company\\/organization/i.test(body);
        const hydrated = hasJob && inputs.length >= 1;
        return {
          href: location.href,
          hasJob,
          hasCo,
          hydrated,
          n: inputs.length,
          sample: inputs.slice(0, 6).map((i) => i.aria.slice(0, 60)),
        };
      })()`);
      if (st.hydrated) return st;
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

  const before = await evalv(`(() => {
    const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
    return {
      href: location.href,
      hasJob: body.includes(${JSON.stringify(JOB)}),
      hasCo: new RegExp(${JSON.stringify(COMPANY)}, 'i').test(body),
      head: body.slice(0, 500),
    };
  })()`);
  console.log('before', { href: before.href, hasJob: before.hasJob, hasCo: before.hasCo });
  if (/\/login|\/uas\/login|checkpoint/i.test(before.href)) {
    console.error('FALHOU: nao autenticado', before.href);
    process.exitCode = 3;
    s.close();
    return;
  }
  if (before.hasJob && before.hasCo && !FORCE) {
    console.log('OK ja configurado (skip)', before.href);
    s.close();
    return;
  }

  async function openPositionForm() {
    let hit = await clickAnchorHref('/edit/forms/position');
    if (hit) {
      console.log('spa-click', hit.text || hit.href);
      return true;
    }
    // "Adicionar experiência" / + na secao Experiencia
    if (await clickTextPreferLower('adicionar experi[eê]ncia|add (an )?experience|^\\+$')) {
      await sleep(1500);
      hit = await clickAnchorHref('/edit/forms/position');
      if (hit) {
        console.log('spa-click', hit.text || hit.href);
        return true;
      }
      const form = await waitPositionForm(8);
      if (form?.hasJob || form?.hasCo) return true;
    }
    if (!(await clickTextPreferLower('^adicionar se[cç][aã]o$|^add (profile )?section$'))) {
      return false;
    }
    await sleep(1800);
    hit = await clickAnchorHref('/edit/forms/position');
    if (hit) {
      console.log('spa-click', hit.text || hit.href);
      return true;
    }
    hit = await evalv(`(() => {
      const el = [...document.querySelectorAll('a,button,[role=menuitem]')].find((e) => {
        if (!e.getClientRects().length) return false;
        const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
        return /adicionar experi|add experience|experi[eê]ncia/i.test(t);
      });
      if (!el) return null;
      el.click();
      return {
        text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        href: el.getAttribute('href') || '',
      };
    })()`);
    if (hit) {
      console.log('spa-click', hit.text || hit.href);
      return true;
    }
    return false;
  }

  if (!(await openPositionForm())) {
    console.error('FALHOU: nao achou ancora /edit/forms/position');
    const st = await evalv(
      `({href:location.href,anchors:[...document.querySelectorAll('a[href*="edit/forms"]')].map(a=>a.getAttribute('href')).slice(0,20),body:(document.body?.innerText||'').replace(/\\s+/g,' ').slice(0,300)})`,
    );
    console.log('state', st);
    process.exitCode = 2;
    s.close();
    return;
  }

  const form = await waitPositionForm(25);
  if (!form?.hydrated) {
    console.error('FALHOU: form experiencia nao hidratou');
    console.log('state', form);
    process.exitCode = 2;
    s.close();
    return;
  }
  console.log('form', form);

  await typeahead(JOB, 'cargo|title|job|fun[cç][aã]o|gerente de produtos|exemplo:\\s*gerente');
  await sleep(500);
  await typeahead(COMPANY, 'empresa|company|empregador|employer|organiza|exemplo:\\s*microsoft');

  // cargo atual — checkbox "Trabalho aqui atualmente"
  await evalv(`(() => {
    const boxes = [...document.querySelectorAll('input[type=checkbox]')].filter((e) => e.getClientRects().length);
    const box = boxes.find((e) =>
      /trabalho aqui atualmente|currently work|cargo atual|i currently work/i.test(
        (e.getAttribute('aria-label') || '') + ' ' + (e.closest('label')?.innerText || ''),
      ),
    );
    if (!box) return false;
    if (!box.checked) box.click();
    return true;
  })()`).then((v) => console.log('currentRole', v));
  await sleep(400);

  // Salvar / Save
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
  await sleep(5000);
  await clickSkipIfAny();

  // verifica
  await s.send('Page.navigate', { url: PROFILE });
  await sleep(4500);
  const check = await evalv(`(() => {
    const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
    return {
      href: location.href,
      hasJob: body.includes(${JSON.stringify(JOB)}),
      hasCo: new RegExp(${JSON.stringify(COMPANY)}, 'i').test(body),
      head: body.slice(0, 500),
    };
  })()`);
  console.log('FINAL', check);
  if (!check.hasJob) {
    console.error('FALHOU: cargo nao apareceu no perfil');
    process.exitCode = 2;
  } else {
    console.log('OK job configurado', check.href);
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
