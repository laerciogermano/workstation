#!/usr/bin/env node
/**
 * Cadastro LinkedIn via CDP — so ate confirmar e-mail (PIN).
 * Depois navega para /feed/ para ver se a conta ja abre sem onboarding.
 *
 * Entradas CLI (obrigatorias):
 *   --email --password --first|--nome --last|--sobrenome
 * Opcional: --code PIN  (senao busca no Mailcow via SSH)
 *
 * Cliques: so Input.dispatchMouseEvent. Digita: Input.insertText.
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
const FIRST = arg('--first', '--nome');
const LAST = arg('--last', '--sobrenome');
let CODE = arg('--code');

const USO = `uso: node linkedin-signup-until-email-cdp.mjs \\
  --email EMAIL --password SENHA --first NOME --last SOBRENOME`;

function mailSshPass() {
  if (process.env.MAIL_SSH_PASS) return process.env.MAIL_SSH_PASS;
  const cred = resolve(__dir, '../../../credenciais.md');
  if (!existsSync(cred)) return '';
  const m = readFileSync(cred, 'utf8').match(
    /`root@144\.126\.154\.90`\s*—\s*`([^`]+)`/,
  );
  return m ? m[1] : '';
}

/** Ultimo PIN LinkedIn na INBOX (assunto encoded). */
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
  if (!EMAIL || !PASS || !FIRST || !LAST) {
    console.error(USO);
    process.exit(1);
  }
  console.log({ CDP, EMAIL, FIRST, LAST, mode: 'until-email' });

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
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').slice(0, 450),
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

  const findSkip = async () =>
    evalv(`(() => {
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

  const clickSkipIfAny = async () => {
    const sk = await findSkip();
    if (!sk) return false;
    console.log('click', sk.text);
    await clickXY(sk.x, sk.y);
    await sleep(2000);
    return true;
  };

  /** Captcha / Verificação de segurança (Arkose/reCAPTCHA) — espera resolucao manual. */
  const hasSecurityChallenge = async () =>
    evalv(`(() => {
      const body = (document.body?.innerText || '');
      if (/verifica[cç][aã]o de seguran[cç]a|security (verification|check)|challenge/i.test(body)) return true;
      const ifr = [...document.querySelectorAll('iframe')];
      return ifr.some((f) =>
        /protechts|challengeIframe|recaptcha|arkoselabs|funcaptcha/i.test(f.src || '') ||
        /verifica[cç][aã]o de seguran[cç]a|security verification/i.test(f.title || ''),
      );
    })()`);

  const waitSecurityChallenge = async (maxMs = 10 * 60_000) => {
    if (!(await hasSecurityChallenge())) return false;
    console.log('AGUARDE: Verificação de segurança — resolva o captcha na janela do Chrome');
    const t0 = Date.now();
    let n = 0;
    while (Date.now() - t0 < maxMs) {
      if (!(await hasSecurityChallenge())) {
        console.log('segurança ok');
        await sleep(1500);
        return true;
      }
      if (n % 6 === 0) console.log('aguardando captcha…', Math.round((Date.now() - t0) / 1000) + 's');
      n++;
      await sleep(5000);
    }
    throw new Error('timeout: verificação de segurança nao resolvida');
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

  /** Apos PIN: tenta /feed/ sem preencher onboarding. */
  async function probeFeedWithoutOnboarding() {
    for (let n = 0; n < 4; n++) {
      if (await clickSkipIfAny()) continue;
      break;
    }

    console.log('probe: navegar /feed/ (sem onboarding)');
    await s.send('Page.navigate', { url: 'https://www.linkedin.com/feed/' });
    await sleep(4500);

    for (let n = 0; n < 6; n++) {
      if (await clickSkipIfAny()) continue;
      break;
    }

    let st = await snap();
    console.log('probe feed', st.href.slice(0, 120), '|', st.body.slice(0, 120));

    if (/feed/i.test(st.href) && !/onboarding/i.test(st.href)) {
      console.log('RESULTADO: feed OK sem onboarding');
      return { ok: true, st };
    }

    // tenta /in/me e de novo feed
    console.log('probe: navegar /in/me');
    await s.send('Page.navigate', { url: 'https://www.linkedin.com/in/me/' });
    await sleep(4000);
    for (let n = 0; n < 4; n++) {
      if (await clickSkipIfAny()) continue;
      break;
    }
    st = await snap();
    console.log('probe me', st.href.slice(0, 120), '|', st.body.slice(0, 120));

    await s.send('Page.navigate', { url: 'https://www.linkedin.com/feed/' });
    await sleep(4000);
    for (let n = 0; n < 4; n++) {
      if (await clickSkipIfAny()) continue;
      break;
    }
    st = await snap();
    console.log('probe feed2', st.href.slice(0, 120), '|', st.body.slice(0, 120));

    const ok = /feed/i.test(st.href) && !/onboarding/i.test(st.href);
    console.log(ok ? 'RESULTADO: feed OK sem onboarding' : 'RESULTADO: ainda exige onboarding / nao chegou no feed');
    return { ok, st };
  }

  let st = await snap();
  console.log('now', st.href);

  if (!/onboarding|signup|checkpoint/i.test(st.href)) {
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

  for (let nameTry = 0; nameTry < 3; nameTry++) {
    st = await snap();
    if (await hasSecurityChallenge()) {
      await waitSecurityChallenge();
      st = await snap();
    }
    if (
      !(
        st.inputs.some((i) => i.id === 'first-name') ||
        (/Nome|Sobrenome|First name|Last name/i.test(st.body) &&
          !/handle-confirmation|código de 6/i.test(st.href + st.body))
      )
    ) {
      break;
    }
    await fill('#first-name', FIRST);
    await fill('#last-name', LAST);
    const vals = await evalv(
      `({f:document.querySelector('#first-name')?.value||'',l:document.querySelector('#last-name')?.value||''})`,
    );
    console.log('name values', vals);
    await clickRe('continuar|continue');
    await sleep(4500);
    if (await hasSecurityChallenge()) {
      await waitSecurityChallenge();
      break;
    }
  }

  let emailConfirmed = false;

  for (let i = 0; i < 20; i++) {
    st = await snap();
    console.log('step', i, st.href.slice(0, 90), '|', st.body.slice(0, 100));

    if (/feed/i.test(st.href) && !/onboarding/i.test(st.href)) {
      console.log('ok feed (ja no feed)');
      emailConfirmed = true;
      break;
    }

    if (await hasSecurityChallenge()) {
      await waitSecurityChallenge();
      continue;
    }

    if (await clickSkipIfAny()) continue;

    // ainda no form de nome — retenta (so se nao houver captcha)
    if (
      st.inputs.some((i) => i.id === 'first-name') &&
      !/handle-confirmation/i.test(st.href)
    ) {
      await fill('#first-name', FIRST);
      await fill('#last-name', LAST);
      await clickRe('continuar|continue');
      await sleep(4500);
      continue;
    }

    if (
      /handle-confirmation/i.test(st.href) ||
      (/código de 6|confirme seu e-mail|confirm your email/i.test(st.body) &&
        st.inputs.some(
          (inp) =>
            inp.type === 'text' ||
            inp.type === 'tel' ||
            /c[oó]digo|code|pin/i.test(inp.aria + inp.ph),
        ))
    ) {
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
      const pin = st.inputs.find(
        (inp) =>
          inp.type === 'text' ||
          inp.type === 'tel' ||
          /c[oó]digo|code|pin/i.test(inp.aria + inp.ph),
      );
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
      await clickRe('continuar|continue|confirmar|verify');
      await sleep(3500);
      emailConfirmed = true;
      console.log('e-mail confirmado — parando onboarding; probe feed');
      break;
    }

    // apos signup, se ja saiu do confirmation e caiu em onboarding → para e testa feed
    if (/onboarding/i.test(st.href) && !/handle-confirmation/i.test(st.href)) {
      console.log('caiu em onboarding sem PIN na tela — probe feed sem preencher');
      emailConfirmed = true;
      break;
    }

    break;
  }

  if (!emailConfirmed) {
    console.error('FALHOU: nao confirmou e-mail');
    process.exitCode = 2;
    s.close();
    return;
  }

  const { ok, st: final } = await probeFeedWithoutOnboarding();
  console.log('FINAL', final.href, '|', final.body.slice(0, 200));
  if (!ok) {
    console.error('FALHOU: conta nao abre feed sem onboarding');
    process.exitCode = 2;
  } else {
    console.log('OK feed sem onboarding');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
