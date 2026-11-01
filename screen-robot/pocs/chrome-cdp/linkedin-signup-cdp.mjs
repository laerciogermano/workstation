#!/usr/bin/env node
/**
 * Cadastro LinkedIn via CDP — mínimo.
 *
 *   ./signup-marina-costa.sh \
 *     --location "São Paulo, Brasil" \
 *     --job "Analista" \
 *     --company "Google"
 *
 * Obrigatórios: --location --job|--cargo --company|--empresa
 * Opcional: --code 123456 (PIN e-mail)
 * Cliques: só Input.dispatchMouseEvent (CDP). Digitação: Input.insertText.
 */
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9224';
const EMAIL = process.env.LI_EMAIL || 'marina.costa@clozzy.com.br';
const PASS = process.env.LI_PASSWORD || 'in@12345678';
const FIRST = process.env.LI_FIRST || 'Marina';
const LAST = process.env.LI_LAST || 'Costa';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(...flags) {
  for (const flag of flags) {
    const i = process.argv.indexOf(flag);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('-')) {
      return process.argv[i + 1];
    }
    const eq = process.argv.find((a) => a.startsWith(flag + '='));
    if (eq) return eq.slice(flag.length + 1);
  }
  return '';
}

const LOCATION = arg('--location') || process.env.LI_LOCATION || '';
const JOB = arg('--job', '--cargo') || process.env.LI_JOB || '';
const COMPANY = arg('--company', '--empresa') || process.env.LI_COMPANY || '';
const CODE = arg('--code') || process.env.LI_CODE || '';

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
  if (!LOCATION || !JOB || !COMPANY) {
    console.error(
      'uso: node linkedin-signup-cdp.mjs --location "São Paulo, Brasil" --job "Analista" --company "Google"',
    );
    process.exit(1);
  }
  console.log({ CDP, EMAIL, FIRST, LAST, LOCATION, JOB, COMPANY });

  const page =
    (await json('/json/list')).find(
      (t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://'),
    ) || (await json('/json/list')).find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error(`sem página em ${CDP}`);

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

  /** Clique só via CDP. */
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

  const snap = () =>
    evalv(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').slice(0, 400),
      inputs: [...document.querySelectorAll('input')].filter((e) => e.getClientRects().length).map((e) => {
        const b = e.getBoundingClientRect();
        return {
          id: e.id, type: e.type, aria: e.getAttribute('aria-label') || '',
          ph: e.placeholder || '', value: e.type === 'password' ? (e.value ? '[set]' : '') : e.value,
          x: b.x + b.width / 2, y: b.y + b.height / 2,
        };
      }),
      btns: [...document.querySelectorAll('button,[role=button]')].filter((e) => e.getClientRects().length).map((e) => {
        const b = e.getBoundingClientRect();
        return {
          text: (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
          x: b.x + b.width / 2, y: b.y + b.height / 2,
        };
      }).filter((b) => b.text),
    }))()`);

  const clickRe = async (reSrc) => {
    const hit = await evalv(`(() => {
      const re = new RegExp(${JSON.stringify(reSrc)}, 'i');
      const el = [...document.querySelectorAll('button,[role=button],input[type=submit]')].find((e) =>
        re.test(e.innerText || e.value || e.getAttribute('aria-label') || ''),
      );
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { text: (el.innerText || el.value || '').trim().slice(0, 60), x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    if (!hit) throw new Error('botão: ' + reSrc);
    console.log('click', hit.text);
    await clickXY(hit.x, hit.y);
  };

  const fill = async (sel, text) => {
    const box = await evalv(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    if (!box) throw new Error('campo: ' + sel);
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
    await s.send('Input.insertText', { text });
    console.log('fill', sel, sel.includes('password') ? '[set]' : text);
  };

  /** Digita no input (hint no aria/placeholder) e clica a opção do typeahead via CDP. */
  const typeahead = async (text, hintRe) => {
    const box = await evalv(`(() => {
      const re = new RegExp(${JSON.stringify(hintRe)}, 'i');
      const el = [...document.querySelectorAll('input[type=text],input:not([type])')]
        .filter((e) => e.getClientRects().length)
        .find((e) => re.test((e.getAttribute('aria-label') || '') + ' ' + (e.placeholder || '')))
        || [...document.querySelectorAll('input[type=text]')].find((e) => e.getClientRects().length);
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2, aria: el.getAttribute('aria-label') || '' };
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
    await s.send('Input.insertText', { text });
    await sleep(2500);
    const first = text.split(',')[0].trim().toLowerCase();
    const pick = await evalv(`(() => {
      const first = ${JSON.stringify(first)};
      const full = ${JSON.stringify(text.trim().toLowerCase())};
      const opts = [...document.querySelectorAll('[role=option]')].map((el) => {
        const b = el.getBoundingClientRect();
        const t = (el.innerText || '').replace(/\\s+/g, ' ').trim();
        return t ? { text: t, x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
      }).filter(Boolean);
      const chosen =
        opts.find((o) => o.text.toLowerCase() === full) ||
        opts.find((o) => o.text.toLowerCase() === first) ||
        opts.find((o) => o.text.toLowerCase().startsWith(first + ',')) ||
        opts.find((o) => o.text.toLowerCase().startsWith(first)) ||
        opts[0];
      return { n: opts.length, chosen, sample: opts.slice(0, 5).map((o) => o.text) };
    })()`);
    console.log('opts', pick.sample);
    if (!pick.chosen) throw new Error('sem opção typeahead para: ' + text);
    console.log('pick', pick.chosen.text);
    await clickXY(pick.chosen.x, pick.chosen.y);
    await sleep(500);
  };

  let st = await snap();
  console.log('now', st.href);

  // signup se ainda não estiver no onboarding
  if (!/onboarding/i.test(st.href)) {
    await s.send('Page.navigate', { url: 'https://www.linkedin.com/signup' });
    await sleep(3000);
    st = await snap();
  }

  if (st.inputs.some((i) => i.id === 'email-or-phone')) {
    await fill('#email-or-phone', EMAIL);
    await fill('#password', PASS);
    await clickRe('avan[cç]ar|aceite|join|cadastre');
    await sleep(3000);
    st = await snap();
  }

  if (st.inputs.some((i) => i.id === 'first-name') || /Nome|Sobrenome/i.test(st.body)) {
    await fill('#first-name', FIRST);
    await fill('#last-name', LAST);
    await clickRe('continuar|continue');
    await sleep(3000);
    st = await snap();
  }

  // onboarding: cargo/empresa e depois localidade (--location)
  for (let i = 0; i < 6; i++) {
    st = await snap();
    console.log('step', i, st.href.slice(0, 80), '|', st.body.slice(0, 100));

    if (/código|confirma|confirmation|handle-confirmation/i.test(st.href + st.body)) {
      if (!CODE) throw new Error('passo PIN: passe --code 123456');
      const pin = st.inputs.find((inp) => inp.type === 'text' || inp.type === 'tel' || /c[oó]digo|code|pin/i.test(inp.aria + inp.ph));
      if (!pin) throw new Error('campo PIN não encontrado');
      await clickXY(pin.x, pin.y);
      await s.send('Input.insertText', { text: CODE });
      console.log('code', CODE);
      await clickRe('continuar|continue|confirmar|verify');
      await sleep(3000);
      continue;
    }

    if (/localidade|location|profile-location/i.test(st.href + st.body)) {
      await typeahead(LOCATION, 'local|location|cidade|vaga');
      await clickRe('continuar|continue');
      await sleep(3000);
      continue;
    }

    if (/profile-edit|experiência|cargo|empresa/i.test(st.href + st.body)) {
      if (st.inputs.some((inp) => inp.type === 'text' && /cargo|title|job/i.test(inp.aria + inp.ph) && !inp.value)) {
        await typeahead(JOB, 'cargo|title|job');
      }
      if (st.inputs.some((inp) => inp.type === 'text' && /empresa|company|empregador/i.test(inp.aria + inp.ph) && !inp.value)) {
        await typeahead(COMPANY, 'empresa|company|empregador');
      }
      try {
        await clickRe('continuar|continue');
      } catch {
        break;
      }
      await sleep(3000);
      continue;
    }

    break;
  }
  st = await snap();

  console.log('FINAL', st.href, '|', st.body.slice(0, 200));
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
