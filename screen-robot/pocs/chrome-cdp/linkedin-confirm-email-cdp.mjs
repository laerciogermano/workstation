#!/usr/bin/env node
/**
 * Confirma e-mail LinkedIn via CDP (PIN Mailcow).
 * Abre/traz LinkedIn, localiza tela de confirmacao, busca PIN e confirma.
 *
 * Entradas CLI:
 *   --email EMAIL          (obrigatorio — mailbox Mailcow)
 *   --password SENHA       (opcional — login se cair na tela de entrar)
 *   --code PIN             (opcional — senao poll Mailcow)
 *
 * Cliques: Input.dispatchMouseEvent. Digita: Input.insertText.
 * Regra: se aparecer Pular, clica.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
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
let CODE = arg('--code');

const USO = `uso: node linkedin-confirm-email-cdp.mjs --email EMAIL [--password SENHA] [--code PIN]`;

function mailSshPass() {
  if (process.env.MAIL_SSH_PASS) return process.env.MAIL_SSH_PASS;
  const cred = resolve(__dir, '../../../credenciais.md');
  if (!existsSync(cred)) return '';
  const m = readFileSync(cred, 'utf8').match(
    /`root@144\.126\.154\.90`\s*—\s*`([^`]+)`/,
  );
  return m ? m[1] : '';
}

function fetchPin(email) {
  const pass = mailSshPass();
  if (!pass) return null;
  const remote = `docker exec mailcowdockerized-dovecot-mailcow-1 doveadm fetch -u ${email} "hdr.date hdr.subject" MAILBOX INBOX 2>/dev/null | grep -E 'hdr\\.(date|subject)' | paste - - | tail -5`;
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
      process.env.MAIL_SSH_HOST || 'root@144.126.154.90',
      remote,
    ],
    { env: { ...process.env, SSHPASS: pass }, encoding: 'utf8', timeout: 45_000 },
  );
  const out = (r.stdout || '') + (r.stderr || '');
  const codes = [...out.matchAll(/PIN_=C3=A9_(\d{6})/g)].map((m) => m[1]);
  if (!codes.length) {
    const alt = [...out.matchAll(/PIN[^\d]{0,20}(\d{6})/gi)].map((m) => m[1]);
    return alt.length ? alt[alt.length - 1] : null;
  }
  return codes[codes.length - 1];
}

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
  if (!EMAIL) {
    console.error(USO);
    process.exit(1);
  }
  console.log({ CDP, EMAIL, mode: 'confirm-email' });

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
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').slice(0, 500),
      inputs: [...document.querySelectorAll('input')].filter((e) => e.getClientRects().length).map((e) => {
        const b = e.getBoundingClientRect();
        return {
          id: e.id, type: e.type, aria: e.getAttribute('aria-label') || '',
          ph: e.placeholder || '',
          value: e.type === 'password' ? (e.value ? '[set]' : '') : e.value,
          x: b.x + b.width / 2, y: b.y + b.height / 2,
        };
      }),
      btns: [...document.querySelectorAll('button,a,[role=button]')].filter((e) => e.getClientRects().length).map((e) => {
        const b = e.getBoundingClientRect();
        return {
          text: (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
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
    await sleep(2000);
    return true;
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

  const isPinScreen = (st) =>
    /handle-confirmation/i.test(st.href) ||
    (/código de 6|confirme seu e-mail|confirm your email|verifique seu e-mail|verify your email/i.test(
      st.body,
    ) &&
      st.inputs.some(
        (inp) =>
          inp.type === 'text' ||
          inp.type === 'tel' ||
          /c[oó]digo|code|pin/i.test(inp.aria + inp.ph),
      ));

  const findPinInput = (st) =>
    st.inputs.find(
      (inp) =>
        inp.type === 'text' ||
        inp.type === 'tel' ||
        /c[oó]digo|code|pin/i.test(inp.aria + inp.ph),
    );

  // abre LinkedIn
  let st = await snap();
  console.log('now', st.href);
  if (!/linkedin\.com/i.test(st.href)) {
    await s.send('Page.navigate', { url: 'https://www.linkedin.com/feed/' });
    await sleep(4000);
    st = await snap();
  }

  // login se necessario
  if (
    PASS &&
    (/\/login|\/uas\/login|checkpoint\/lg/i.test(st.href) ||
      st.inputs.some((i) => i.id === 'username' || i.type === 'password'))
  ) {
    if (st.inputs.some((i) => i.id === 'username')) {
      await fill('#username', EMAIL);
      await fill('#password', PASS);
      await clickRe('entrar|sign in|login|continuar');
      await sleep(4000);
      st = await snap();
    }
  }

  // tenta achar/abrir UI de confirmacao
  for (let i = 0; i < 12; i++) {
    st = await snap();
    console.log('seek', i, st.href.slice(0, 100), '|', st.body.slice(0, 100));

    if (await clickSkipIfAny()) continue;

    if (isPinScreen(st)) break;

    // banner / CTA confirmar e-mail
    const confirmCta = st.btns.find((b) =>
      /confirmar e-mail|confirm email|verificar e-mail|verify email|enviar c[oó]digo|enviar codigo|reenviar/i.test(
        b.text,
      ),
    );
    if (confirmCta) {
      console.log('click', confirmCta.text);
      await clickXY(confirmCta.x, confirmCta.y);
      await sleep(3000);
      continue;
    }

    // atalho settings e-mail
    if (i === 3) {
      console.log('nav settings/email');
      await s.send('Page.navigate', {
        url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
      });
      await sleep(4000);
      continue;
    }
    if (i === 6) {
      console.log('nav feed (buscar banner)');
      await s.send('Page.navigate', { url: 'https://www.linkedin.com/feed/' });
      await sleep(4000);
      continue;
    }
    if (i === 9) {
      console.log('nav checkpoint handle-confirmation (se existir sessao)');
      await s.send('Page.navigate', {
        url: 'https://www.linkedin.com/checkpoint/challenge/AgF',
      });
      await sleep(3000);
      continue;
    }

    await sleep(1500);
  }

  st = await snap();
  if (!isPinScreen(st)) {
    console.error('FALHOU: tela de confirmacao de e-mail / PIN nao encontrada');
    console.log('FINAL', st.href, '|', st.body.slice(0, 220));
    process.exitCode = 2;
    s.close();
    return;
  }

  if (!CODE) {
    console.log('PIN: poll Mailcow…');
    for (let p = 0; p < 18; p++) {
      CODE = fetchPin(EMAIL);
      if (CODE) break;
      console.log('poll', p + 1, 'sem PIN');
      try {
        await clickRe('reenviar|resend');
      } catch {
        /* ignore */
      }
      await sleep(8000);
    }
  }
  if (!CODE) throw new Error('PIN nao chegou no Mailcow');
  console.log('code', CODE);

  st = await snap();
  const pin = findPinInput(st);
  if (!pin) throw new Error('campo PIN ausente');
  await clickXY(pin.x, pin.y);
  await s.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: pin.x,
    y: pin.y,
    button: 'left',
    clickCount: 3,
  });
  await s.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: pin.x,
    y: pin.y,
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
  await s.send('Input.insertText', { text: CODE });
  await clickRe('continuar|continue|confirmar|verify|enviar|submit');
  await sleep(3500);

  for (let n = 0; n < 4; n++) {
    if (await clickSkipIfAny()) continue;
    break;
  }

  st = await snap();
  console.log('FINAL', st.href, '|', st.body.slice(0, 220));
  if (isPinScreen(st)) {
    console.error('FALHOU: ainda na tela de PIN');
    process.exitCode = 2;
  } else {
    console.log('OK e-mail confirmado (ou saiu da tela de PIN)');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
