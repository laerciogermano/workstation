#!/usr/bin/env node
/**
 * Cadastro LinkedIn via CDP — basico: so ate nome + sobrenome (+ Continuar).
 * Para apos submeter o nome. Sem PIN, captcha wait, onboarding ou probe /feed.
 *
 * Entradas CLI (obrigatorias):
 *   --email --password --first|--nome --last|--sobrenome
 *
 * Cliques: so Input.dispatchMouseEvent. Digita: Input.insertText.
 */
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9224';
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

const EMAIL = arg('--email');
const PASS = arg('--password');
const FIRST = arg('--first', '--nome');
const LAST = arg('--last', '--sobrenome');

const USO = `uso: node linkedin-signup-until-name-cdp.mjs \\
  --email EMAIL --password SENHA --first NOME --last SOBRENOME`;

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
  if (!EMAIL || !PASS || !FIRST || !LAST) {
    console.error(USO);
    process.exit(1);
  }
  console.log({ CDP, EMAIL, FIRST, LAST, mode: 'until-name' });

  const pages = await json('/json/list');
  const page =
    pages.find((t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://')) ||
    pages.find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error(`sem pagina em ${CDP}`);

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

  const snap = () =>
    evalv(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').slice(0, 350),
      inputs: [...document.querySelectorAll('input')].filter((e) => e.getClientRects().length).map((e) => {
        const b = e.getBoundingClientRect();
        return {
          id: e.id, type: e.type,
          value: e.type === 'password' ? (e.value ? '[set]' : '') : e.value,
          x: b.x + b.width / 2, y: b.y + b.height / 2,
        };
      }),
      btns: [...document.querySelectorAll('button,a,[role=button]')].filter((e) => e.getClientRects().length).map((e) => {
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
      const el = [...document.querySelectorAll('button,a,[role=button],input[type=submit]')].find((e) =>
        re.test(e.innerText || e.value || e.getAttribute('aria-label') || ''),
      );
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { text: (el.innerText || el.value || '').trim().slice(0, 60), x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    if (!hit) throw new Error('botao: ' + reSrc);
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

  let st = await snap();
  console.log('now', st.href);

  if (!/signup|checkpoint/i.test(st.href)) {
    await s.send('Page.navigate', { url: 'https://www.linkedin.com/signup' });
    await sleep(3500);
    st = await snap();
  }

  if (st.inputs.some((i) => i.id === 'email-or-phone')) {
    await fill('#email-or-phone', EMAIL);
    await fill('#password', PASS);
    await clickRe('avan[cç]ar|aceite|join|cadastre');
    await sleep(3500);
    st = await snap();
  }

  let nameDone = false;
  for (let nameTry = 0; nameTry < 3; nameTry++) {
    st = await snap();
    const onName =
      st.inputs.some((i) => i.id === 'first-name') ||
      /Nome|Sobrenome|First name|Last name/i.test(st.body);
    if (!onName) {
      // ja passou do form de nome
      nameDone = true;
      break;
    }
    await fill('#first-name', FIRST);
    await fill('#last-name', LAST);
    const vals = await evalv(
      `({f:document.querySelector('#first-name')?.value||'',l:document.querySelector('#last-name')?.value||''})`,
    );
    console.log('name values', vals);
    if (!vals.f || !vals.l) {
      console.log('nome incompleto, retenta');
      continue;
    }
    await clickRe('continuar|continue');
    await sleep(4000);
    nameDone = true;
    break;
  }

  st = await snap();
  console.log('FINAL', st.href, '|', st.body.slice(0, 200));
  if (!nameDone) {
    console.error('FALHOU: nao submeteu nome/sobrenome');
    process.exitCode = 2;
  } else {
    console.log('OK ate nome/sobrenome (parado)');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
