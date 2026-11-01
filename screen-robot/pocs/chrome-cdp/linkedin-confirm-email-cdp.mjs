#!/usr/bin/env node
/**
 * Confirma e-mail LinkedIn via CDP.
 * Abre LI; usa link de confirmacao do Mailcow e/ou PIN (6 digitos).
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

function mailFetchText(email) {
  const pass = mailSshPass();
  if (!pass) return '';
  const remote = `docker exec mailcowdockerized-dovecot-mailcow-1 doveadm fetch -u ${email} "hdr.subject text" MAILBOX INBOX 2>/dev/null | tail -c 200000`;
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
    { env: { ...process.env, SSHPASS: pass }, encoding: 'utf8', timeout: 60_000 },
  );
  return (r.stdout || '') + (r.stderr || '');
}

/** Decodifica QP soft-breaks do corpo do e-mail LinkedIn. */
function decodeMailBody(raw) {
  const soft = String(raw).replace(/=\r?\n/g, '');
  try {
    return soft
      .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&amp;/g, '&');
  } catch {
    return soft;
  }
}

function fetchPin(email) {
  const out = mailFetchText(email);
  const decoded = decodeMailBody(out);
  // assunto encoded pode partir o PIN (ex.: _1 + 08399)
  const joined = out.replace(/\s+/g, '');
  const split = joined.match(/PIN_=C3=A9_(\d)(?:=?\?=)?(?:=?\?UTF-8\?Q\?)?(\d{5})/i);
  if (split) return split[1] + split[2];
  const codes = [...decoded.matchAll(/PIN[^\d]{0,30}(\d{6})/gi)].map((m) => m[1]);
  if (codes.length) return codes[codes.length - 1];
  const lone = [...decoded.matchAll(/(?:^|\n)\s*(\d{6})\s*(?:\n|$)/g)].map((m) => m[1]);
  return lone.length ? lone[lone.length - 1] : null;
}

function fetchConfirmLink(email) {
  const decoded = decodeMailBody(mailFetchText(email));
  const urls = [
    ...decoded.matchAll(
      /https:\/\/www\.linkedin\.com\/(?:comm\/)?psettings\/email\/confirm\?[^\s"'<>]+/gi,
    ),
  ].map((m) => m[0].replace(/&amp;/g, '&').replace(/[).,;>]+$/, ''));
  return urls.length ? urls[urls.length - 1] : null;
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

  const needsEmailConfirm = (st) =>
    /confirmar seu e-mail|confirm your email|novo link de confirma|confirmação|confirmation link/i.test(
      st.body,
    );

  const emailAlreadyOk = (st) =>
    /e-mail confirmado|email confirmed|primary.*verified|verificado/i.test(st.body) &&
    !needsEmailConfirm(st);

  const findPinInput = (st) =>
    st.inputs.find(
      (inp) =>
        inp.type === 'text' ||
        inp.type === 'tel' ||
        /c[oó]digo|code|pin/i.test(inp.aria + inp.ph),
    );

  async function confirmViaLink() {
    let link = fetchConfirmLink(EMAIL);
    if (!link) {
      console.log('link: nenhum no Mailcow — pedindo novo link na UI');
      const st0 = await snap();
      const ask = st0.btns.find((b) =>
        /solicite um novo link|novo link de confirma|resend|reenviar/i.test(b.text),
      );
      if (ask) {
        console.log('click', ask.text);
        await clickXY(ask.x, ask.y);
        await sleep(8000);
      }
      for (let p = 0; p < 12; p++) {
        link = fetchConfirmLink(EMAIL);
        if (link) break;
        console.log('poll link', p + 1);
        await sleep(5000);
      }
    }
    if (!link) return false;
    console.log('confirm link', link.slice(0, 120));
    await s.send('Page.navigate', { url: link });
    await sleep(5000);
    for (let n = 0; n < 4; n++) {
      if (await clickSkipIfAny()) continue;
      break;
    }
    return true;
  }

  async function confirmViaPin() {
    if (!CODE) {
      console.log('PIN: poll Mailcow…');
      for (let p = 0; p < 18; p++) {
        CODE = fetchPin(EMAIL);
        if (CODE) break;
        console.log('poll', p + 1, 'sem PIN');
        try {
          await clickRe('reenviar|resend|novo link');
        } catch {
          /* ignore */
        }
        await sleep(8000);
      }
    }
    if (!CODE) throw new Error('PIN nao chegou no Mailcow');
    console.log('code', CODE);
    let stLocal = await snap();
    if (!isPinScreen(stLocal)) return false;
    const pin = findPinInput(stLocal);
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
    return true;
  }

  // abre LinkedIn
  let st = await snap();
  console.log('now', st.href);
  if (!/linkedin\.com/i.test(st.href) || /chrome-error/i.test(st.href)) {
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

  // preferencias de e-mail (banner "confirmar seu e-mail")
  console.log('nav settings/email');
  await s.send('Page.navigate', {
    url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
  });
  await sleep(4000);
  st = await snap();
  console.log('settings', st.href.slice(0, 90), '|', st.body.slice(0, 140));

  if (emailAlreadyOk(st) && !needsEmailConfirm(st)) {
    console.log('OK e-mail ja confirmado');
    s.close();
    return;
  }

  let ok = false;
  if (isPinScreen(st)) {
    ok = await confirmViaPin();
  } else {
    // settings: link no e-mail (sem campo PIN na pagina)
    ok = await confirmViaLink();
    st = await snap();
    if (isPinScreen(st)) ok = (await confirmViaPin()) || ok;
  }

  for (let n = 0; n < 4; n++) {
    if (await clickSkipIfAny()) continue;
    break;
  }

  // verifica em settings
  await s.send('Page.navigate', {
    url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
  });
  await sleep(4000);
  st = await snap();
  console.log('FINAL', st.href, '|', st.body.slice(0, 240));
  if (needsEmailConfirm(st) || isPinScreen(st) || !ok) {
    console.error('FALHOU: e-mail ainda nao confirmado');
    process.exitCode = 2;
  } else {
    console.log('OK e-mail confirmado');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
