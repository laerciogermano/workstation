#!/usr/bin/env node
/**
 * Cadastro LinkedIn via CDP — autonomo (sem intermediacao).
 *
 * Entradas CLI (obrigatorias):
 *   --email --password --first|--nome --last|--sobrenome
 *   --location --job|--cargo --company|--empresa
 * Opcional: --code PIN  (senao busca no Mailcow via SSH)
 *
 * Cliques: so Input.dispatchMouseEvent. Digita: Input.insertText.
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
const LOCATION = arg('--location');
const JOB = arg('--job', '--cargo');
const COMPANY = arg('--company', '--empresa');
let CODE = arg('--code');

const USO = `uso: node linkedin-signup-cdp.mjs \\
  --email EMAIL --password SENHA --first NOME --last SOBRENOME \\
  --location "Cidade, Pais" --job "Cargo" --company "Empresa"`;

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
  if (!EMAIL || !PASS || !FIRST || !LAST || !LOCATION || !JOB || !COMPANY) {
    console.error(USO);
    process.exit(1);
  }
  console.log({ CDP, EMAIL, FIRST, LAST, LOCATION, JOB, COMPANY });

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

  /** Achado robusto de Pular (button ou link). */
  const findSkip = async () =>
    evalv(`(() => {
      const el = [...document.querySelectorAll('button,a,[role=button]')].find((e) => {
        if (!e.getClientRects().length) return false;
        const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
        return /^pular$|^skip$/i.test(t);
      });
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { text: (el.innerText || '').trim(), x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);

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
      return { chosen, sample: opts.slice(0, 5).map((o) => o.text) };
    })()`);
    console.log('opts', pick.sample);
    if (!pick.chosen) throw new Error('sem opcao typeahead: ' + text);
    console.log('pick', pick.chosen.text);
    await clickXY(pick.chosen.x, pick.chosen.y);
    await sleep(500);
  };

  /** Pos-PIN / opcionais: Pular… e Continuar no get-the-app; idade 18+. */
  async function drainOptional() {
    for (let n = 0; n < 14; n++) {
      let st = await snap();
      console.log('drain', n, st.href.slice(0, 90), '|', st.body.slice(0, 80));

      if (/feed/i.test(st.href) && !/onboarding/i.test(st.href)) {
        return st;
      }

      // fechar toast
      const close = st.btns.find((b) => /^fechar$|^close$|^dismiss$/i.test(b.text));
      if (close && /c[oó]digo|notifica/i.test(st.body)) {
        await clickXY(close.x, close.y);
        await sleep(400);
        continue;
      }

      // maior de 18
      if (/maior de 18|birthday|tem mais de 18/i.test(st.body + st.href)) {
        const yes = await evalv(`(() => {
          const radios = [...document.querySelectorAll('input[type=radio]')];
          if (!radios[0]) return null;
          const b = radios[0].getBoundingClientRect();
          return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        })()`);
        if (yes) {
          await clickXY(yes.x, yes.y);
          await sleep(300);
        }
        try {
          await clickRe('continuar|continue');
        } catch {
          /* ignore */
        }
        await sleep(2500);
        continue;
      }

      // carreira / foto / pessoas / seguir: sempre Pular
      const skip = (await findSkip()) || st.btns.find((b) => /^pular$|^skip$/i.test(b.text));
      if (skip || /job-seeker|carreira|people-you-may|follow-recommend|profile-photo/i.test(st.href + st.body)) {
        const s = skip || (await findSkip());
        if (s) {
          console.log('click', s.text);
          await clickXY(s.x, s.y);
          await sleep(2000);
          continue;
        }
      }

      if (/get-the-app|aplicativo/i.test(st.href + st.body)) {
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
    return snap();
  }

  let st = await snap();
  console.log('now', st.href);

  if (!/onboarding/i.test(st.href)) {
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

  if (st.inputs.some((i) => i.id === 'first-name') || /Nome|Sobrenome/i.test(st.body)) {
    await fill('#first-name', FIRST);
    await fill('#last-name', LAST);
    await clickRe('continuar|continue');
    await sleep(3500);
    st = await snap();
  }

  for (let i = 0; i < 12; i++) {
    st = await snap();
    console.log('step', i, st.href.slice(0, 90), '|', st.body.slice(0, 100));

    if (/feed/i.test(st.href) && !/onboarding/i.test(st.href)) {
      console.log('ok feed');
      break;
    }

    if (/código|confirma|confirmation|handle-confirmation/i.test(st.href + st.body)) {
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
      await sleep(3000);
      st = await drainOptional();
      continue;
    }

    if (/localidade|location|profile-location/i.test(st.href + st.body)) {
      await typeahead(LOCATION, 'local|location|cidade|vaga');
      await clickRe('continuar|continue');
      await sleep(3000);
      continue;
    }

    if (/profile-edit|experiência|cargo|empresa/i.test(st.href + st.body)) {
      const hasJob = st.inputs.some(
        (inp) => inp.type === 'text' && /cargo|title|job/i.test(inp.aria + inp.ph),
      );
      const hasCo = st.inputs.some(
        (inp) =>
          inp.type === 'text' && /empresa|company|empregador/i.test(inp.aria + inp.ph),
      );
      if (hasJob) await typeahead(JOB, 'cargo|title|job');
      st = await snap();
      if (
        st.inputs.some(
          (inp) =>
            inp.type === 'text' && /empresa|company|empregador/i.test(inp.aria + inp.ph),
        )
      ) {
        await typeahead(COMPANY, 'empresa|company|empregador');
      } else if (hasCo) {
        await typeahead(COMPANY, 'empresa|company|empregador');
      }
      try {
        await clickRe('continuar|continue');
      } catch (e) {
        console.log('experience continue fail', e.message);
        break;
      }
      await sleep(3000);
      continue;
    }

    // carreira / pular / idade / app
    if (
      (await findSkip()) ||
      /job-seeker|carreira relevantes|get-the-app|aplicativo|maior de 18|birthday|people-you-may|follow-recommend|profile-photo/i.test(
        st.href + st.body,
      )
    ) {
      st = await drainOptional();
      if (/feed/i.test(st.href)) break;
      continue;
    }

    break;
  }

  st = await snap();
  console.log('FINAL', st.href, '|', st.body.slice(0, 200));
  if (!/feed/i.test(st.href)) {
    console.error('FALHOU: nao chegou no feed');
    process.exitCode = 2;
  } else {
    console.log('OK feed');
  }
  s.close();
}

main().catch((e) => {
  console.error('Falha:', e.message || e);
  process.exit(1);
});
