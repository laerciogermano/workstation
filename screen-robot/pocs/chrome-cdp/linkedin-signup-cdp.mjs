#!/usr/bin/env node
/**
 * Cadastro LinkedIn via Chrome CDP (web).
 *
 * Pré-req: Chrome isolado no ar (ex.: ./start-marina-costa.sh).
 *
 * Uso (Marina — defaults):
 *   node linkedin-signup-cdp.mjs
 *   CDP_URL=http://127.0.0.1:9224 node linkedin-signup-cdp.mjs
 *
 * Env:
 *   CDP_URL      default http://127.0.0.1:9224
 *   LI_EMAIL     default marina.costa@clozzy.com.br
 *   LI_PASSWORD  default in@12345678
 *   LI_FIRST     default Marina
 *   LI_LAST      default Costa
 *   MAIL_SSH_HOST / MAIL_SSH_PASS — poll código 6 dígitos no Mailcow (opcional)
 *   --no-email-code  não espera/confirma e-mail
 *
 * Rollback: fechar aba; apagar conta LI; status CSV de volta a nao_criada.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const NO_EMAIL_CODE = args.has('--no-email-code');

const CDP_BASE = process.env.CDP_URL || 'http://127.0.0.1:9224';
const EMAIL = process.env.LI_EMAIL || 'marina.costa@clozzy.com.br';
const PASSWORD = process.env.LI_PASSWORD || 'in@12345678';
const FIRST = process.env.LI_FIRST || 'Marina';
const LAST = process.env.LI_LAST || 'Costa';
const MAIL_SSH_HOST = process.env.MAIL_SSH_HOST || 'root@144.126.154.90';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function resolveMailSshPass() {
  if (process.env.MAIL_SSH_PASS) return process.env.MAIL_SSH_PASS;
  const cred = resolve(__dir, '../../../credenciais.md');
  if (!existsSync(cred)) return '';
  const t = readFileSync(cred, 'utf8');
  const m = t.match(/`root@144\.126\.154\.90`\s*—\s*`([^`]+)`/);
  return m ? m[1] : '';
}

async function getJson(path) {
  const res = await fetch(`${CDP_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

function cdpSession(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  const ready = new Promise((ok, err) => {
    ws.addEventListener('open', ok);
    ws.addEventListener('error', err);
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

function fetchMailCode(email) {
  const pass = resolveMailSshPass();
  if (!pass) {
    console.log('mail: sem MAIL_SSH_PASS / credenciais.md — skip poll');
    return null;
  }
  const remote = `
docker exec mailcowdockerized-dovecot-mailcow-1 doveadm fetch -u ${email} "hdr.date hdr.from hdr.subject text" MAILBOX INBOX 2>/dev/null | python3 -c '
import sys,re
data=sys.stdin.read()
parts=re.split(r"(?=^date:)", data, flags=re.M|re.I)
cands=[]
for p in parts:
  if not re.search(r"linkedin", p, re.I): continue
  codes=re.findall(r"\\b(\\d{6})\\b", p)
  for c in codes:
    if c not in cands: cands.append(c)
print("CODES", ",".join(cands[:5]))
'
`.trim();
  const r = spawnSync(
    'sshpass',
    [
      '-e',
      'ssh',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'PreferredAuthentications=password',
      '-o',
      'PubkeyAuthentication=no',
      '-o',
      'ConnectTimeout=20',
      MAIL_SSH_HOST,
      remote,
    ],
    {
      env: { ...process.env, SSHPASS: pass },
      encoding: 'utf8',
      timeout: 45_000,
    },
  );
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/CODES\s+([0-9,\s]+)/);
  if (!m) return null;
  const codes = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return codes[0] || null;
}

async function main() {
  console.log('CDP', CDP_BASE, '|', EMAIL, FIRST, LAST);

  const targets = await getJson('/json/list');
  const page =
    targets.find((t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://')) ||
    targets.find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`sem página CDP em ${CDP_BASE} — rode ./start-marina-costa.sh`);
  }

  const s = cdpSession(page.webSocketDebuggerUrl);
  await s.ready;
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  await s.send('Page.bringToFront');

  async function evalv(expression) {
    const r = await s.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  }

  async function clickXY(x, y) {
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

  async function fillClean(sel, text) {
    const box = await evalv(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      el.focus();
      const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      d.set.call(el, '');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    if (!box) throw new Error('campo ausente: ' + sel);
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
    const v = await evalv(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return null;
      if (el.value !== ${JSON.stringify(text)}) {
        const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        d.set.call(el, ${JSON.stringify(text)});
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(text)}, inputType: 'insertText' }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return el.value;
    })()`);
    console.log('fill', sel, '=>', sel.includes('password') ? '[set]' : v);
  }

  async function clickBtn(reSrc) {
    const hit = await evalv(`(() => {
      const re = new RegExp(${JSON.stringify(reSrc)}, 'i');
      const b = [...document.querySelectorAll('button,[role="button"],input[type="submit"]')].find((el) =>
        re.test(el.innerText || el.value || el.getAttribute('aria-label') || ''),
      );
      if (!b) return null;
      const box = b.getBoundingClientRect();
      return {
        text: (b.innerText || b.value || '').trim().slice(0, 80),
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };
    })()`);
    if (!hit) throw new Error('botão não encontrado: ' + reSrc);
    console.log('click', hit.text);
    await clickXY(hit.x, hit.y);
  }

  async function snap() {
    return evalv(`(() => {
      const inputs = [...document.querySelectorAll('input')]
        .filter((el) => el.getClientRects().length)
        .map((el) => {
          const b = el.getBoundingClientRect();
          return {
            id: el.id,
            name: el.name,
            type: el.type,
            ph: el.placeholder || '',
            value: el.type === 'password' ? (el.value ? '[set]' : '') : el.value,
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
          };
        });
      const btns = [...document.querySelectorAll('button')]
        .filter((el) => el.getClientRects().length)
        .map((el) => {
          const b = el.getBoundingClientRect();
          return {
            text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
          };
        })
        .filter((b) => b.text);
      return {
        href: location.href,
        title: document.title,
        body: (document.body?.innerText || '').replace(/\\s+/g, ' ').slice(0, 500),
        inputs,
        btns: btns.slice(0, 14),
      };
    })()`);
  }

  async function fillCode(code) {
    const sel =
      'input[name="email-confirmation-code"], input#email-confirmation-code, input[autocomplete="one-time-code"], input[inputmode="numeric"], input[maxlength="6"]';
    const box = await evalv(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2, id: el.id, name: el.name };
    })()`);
    if (!box) {
      // fallback: digitar no input focado / primeiro numérico
      await s.send('Input.insertText', { text: code });
      console.log('code typed (fallback insertText)');
      return;
    }
    await clickXY(box.x, box.y);
    await s.send('Input.insertText', { text: code });
    console.log('code typed into', box.id || box.name);
  }

  console.log('navigate → /signup');
  await s.send('Page.navigate', { url: 'https://www.linkedin.com/signup' });
  await sleep(3500);

  let st = await snap();
  console.log('start', st.href, '|', st.body.slice(0, 180));

  if (/feed|\/in\//i.test(st.href) && !/signup|checkpoint/i.test(st.href)) {
    console.log('já logado / fora do signup — abort');
    console.log(JSON.stringify({ href: st.href, title: st.title }, null, 2));
    s.close();
    return;
  }

  if (st.inputs.some((i) => i.id === 'email-or-phone' || i.name === 'email-address')) {
    const emailSel = st.inputs.some((i) => i.id === 'email-or-phone')
      ? '#email-or-phone'
      : 'input[name="email-address"], input#email-address, input[type="email"]';
    const passSel = st.inputs.some((i) => i.id === 'password')
      ? '#password'
      : 'input[name="password"], input#password, input[type="password"]';
    await fillClean(emailSel.includes('#') ? emailSel : emailSel.split(',')[0].trim(), EMAIL);
    // email-or-phone path uses #password; generic may need query again
    try {
      await fillClean(passSel.includes('#') ? passSel : '#password', PASSWORD);
    } catch {
      await fillClean('input[type="password"]', PASSWORD);
    }
    await clickBtn('aceite e cadastre|agree.*join|join now|cadastre-se');
    await sleep(3500);
    st = await snap();
    console.log('after join', st.href, '|', st.body.slice(0, 200));
  }

  if (
    st.inputs.some((i) => i.id === 'first-name' || i.name === 'first-name') ||
    /Nome|First name|Sobrenome|Last name/i.test(st.body)
  ) {
    await fillClean('#first-name', FIRST);
    await fillClean('#last-name', LAST);
    await clickBtn('continuar|continue');
    for (let i = 0; i < 25; i++) {
      await sleep(800);
      st = await snap();
      console.log('wait', (i + 1) * 800, st.href.slice(0, 80), '|', st.body.slice(0, 120));
      if (
        /código|confirma|onboarding|challenge|checkpoint|feed|location|localiza|job|cargo|pin/i.test(
          st.href + st.body,
        )
      )
        break;
      if (!st.inputs.some((inp) => inp.id === 'first-name')) break;
    }
  }

  if (
    !NO_EMAIL_CODE &&
    /código|confirma|confirmation|pin|verif/i.test(st.body + st.href)
  ) {
    console.log('confirmação de e-mail — poll Mailcow…');
    let code = null;
    for (let i = 0; i < 12; i++) {
      code = fetchMailCode(EMAIL);
      if (code) break;
      console.log('poll', i + 1, 'sem código — reenvio se houver botão');
      try {
        await clickBtn('reenviar|resend|enviar novamente');
      } catch {
        /* ignore */
      }
      await sleep(10_000);
      st = await snap();
    }
    if (!code) {
      console.log('FINAL (sem código no Mailcow)', JSON.stringify({
        href: st.href,
        body: st.body,
        inputs: st.inputs,
        btns: st.btns.map((b) => b.text),
      }, null, 2));
      s.close();
      process.exitCode = 2;
      return;
    }
    console.log('código', code);
    await fillCode(code);
    await sleep(500);
    try {
      await clickBtn('enviar|submit|continuar|continue|confirmar|verify');
    } catch {
      /* alguns fluxos avançam sozinhos */
    }
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      st = await snap();
      console.log('post-code', i + 1, st.href.slice(0, 90), '|', st.body.slice(0, 120));
      if (/feed|onboarding|location|localiza|job|cargo|\/in\//i.test(st.href + st.body)) break;
    }
  }

  console.log(
    'FINAL',
    JSON.stringify(
      {
        href: st.href,
        title: st.title,
        body: st.body,
        inputs: st.inputs,
        btns: st.btns.map((b) => b.text),
      },
      null,
      2,
    ),
  );
  s.close();
}

main().catch((err) => {
  console.error('Falha:', err.message || err);
  process.exit(1);
});
