/**
 * Após nome+Continuar: detecta verificação humana vs próxima tela.
 * Se aparecer "Não sou um robô", clica. Senão espera até a próxima tela.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const SNAP = `(() => {
  const href = location.href;
  const body = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
  const hasSecurity = [...document.querySelectorAll('iframe')].some((f) => {
    const src = f.src || '';
    const b = f.getBoundingClientRect();
    if (b.width < 100 || b.height < 120) return false;
    if (!f.getClientRects().length) return false;
    if (/checkpoint\\/challengeIframe/i.test(src)) return true;
    if (/protechts\\.net|arkoselabs|funcaptcha|recaptcha/i.test(src) && b.height > 200) {
      return true;
    }
    if (
      /verifica[cç][aã]o de seguran[cç]a|security verification/i.test(f.title || '') &&
      src &&
      !/^about:blank$/i.test(src) &&
      b.height > 200
    ) {
      return true;
    }
    return false;
  });
  const securityText =
    /verifica[cç][aã]o de seguran[cç]a|security (check|verification)|confirma que voc[eê] [eé] humano|confirm you.?re human|captcha|n[aã]o sou um rob[oô]|i.?m not a robot/i.test(
      body,
    );
  const stillName =
    !!(document.querySelector('#first-name') || document.querySelector('#last-name')) &&
    /primeiro nome|sobrenome|first name|last name/i.test(body);
  const nextScreen =
    /profile-location|profile-edit|experience|localidade|location|onde voc[eê]|cidade|handle-confirmation|email-confirmation|birthday/i.test(
      href + ' ' + body,
    ) ||
    [...document.querySelectorAll('input')].some((i) =>
      /local|cidade|location|empresa|company|cargo|job|title/i.test(
        [i.placeholder, i.getAttribute('aria-label'), i.name, i.id].join(' '),
      ),
    );
  return {
    href,
    body: body.slice(0, 180),
    hasSecurity: hasSecurity || (securityText && !stillName),
    stillName,
    nextScreen,
  };
})()`;

/** Localiza "Não sou um robô" / checkbox reCAPTCHA e devolve ponto de clique. */
const FIND_NOT_ROBOT = `(() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const labelOf = (el) =>
    (el.innerText || el.value || el.getAttribute('aria-label') || el.title || '')
      .replace(/\\s+/g, ' ')
      .trim();
  const re =
    /n[aã]o sou um rob[oô]|i.?m not a robot|not a robot/i;

  // 1) texto/label/checkbox no documento principal
  const nodes = [
    ...document.querySelectorAll(
      'label, span, div, button, [role=checkbox], [role=button], a, p',
    ),
  ].filter(visible);
  const cands = nodes
    .map((el) => ({ el, t: labelOf(el) }))
    .filter((x) => x.t && x.t.length <= 80 && re.test(x.t));
  cands.sort((a, b) => a.t.length - b.t.length);
  if (cands.length) {
    const el = cands[0].el;
    // preferir checkbox associado se houver
    const forId = el.getAttribute('for');
    const box =
      (forId && document.getElementById(forId)) ||
      el.querySelector('input[type=checkbox]') ||
      (el.closest('label') && el.closest('label').querySelector('input[type=checkbox]'));
    const target = box && visible(box) ? box : el;
    const r = target.getBoundingClientRect();
    return {
      label: cands[0].t.slice(0, 80),
      x: Math.round(r.x + Math.min(28, r.width / 2)),
      y: Math.round(r.y + r.height / 2),
      via: 'dom',
    };
  }

  // 2) iframe reCAPTCHA anchor — clique na área do checkbox (esquerda)
  const frames = [...document.querySelectorAll('iframe')].filter(visible);
  for (const f of frames) {
    const src = f.src || '';
    const title = f.title || '';
    if (
      !/recaptcha|anchor/i.test(src + ' ' + title) &&
      !re.test(title)
    ) {
      continue;
    }
    const r = f.getBoundingClientRect();
    if (r.width < 80 || r.height < 40) continue;
    return {
      label: title || 'reCAPTCHA',
      x: Math.round(r.x + 28),
      y: Math.round(r.y + r.height / 2),
      via: 'iframe',
    };
  }

  // 3) checkbox genérico perto de texto de verificação
  const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
  if (/n[aã]o sou um rob[oô]|i.?m not a robot|recaptcha/i.test(body)) {
    const cb = [...document.querySelectorAll('input[type=checkbox], [role=checkbox]')].find(
      visible,
    );
    if (cb) {
      const r = cb.getBoundingClientRect();
      return {
        label: 'checkbox',
        x: Math.round(r.x + r.width / 2),
        y: Math.round(r.y + r.height / 2),
        via: 'checkbox',
      };
    }
  }
  return null;
})()`;

/**
 * @param {{ id: string, dryRun?: boolean, pollMs?: number }} opts
 */
export async function waitSignupAfterName(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('waitSignupAfterName: id obrigatório');
  const pollMs = Number(opts.pollMs) > 0 ? Number(opts.pollMs) : 5_000;

  if (opts.dryRun) {
    return { dryRun: true, id, waited: false, security: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    // transição pós-Continuar
    await sleep(2000);
    let st = await s.evaluate(SNAP);

    if (st.nextScreen && !st.hasSecurity) {
      console.error(`[after-name] próxima tela ok — ${st.href}`);
      return {
        id,
        waited: false,
        security: false,
        href: st.href,
        body: st.body,
      };
    }

    if (!st.hasSecurity && st.stillName) {
      console.error('[after-name] ainda no formulário de nome — aguardando transição…');
      for (let i = 0; i < 12; i++) {
        await sleep(pollMs);
        st = await s.evaluate(SNAP);
        if (st.hasSecurity || st.nextScreen) break;
      }
    }

    if (st.hasSecurity) {
      console.error(
        '[after-name] VERIFICAÇÃO HUMANA — tenta "Não sou um robô"; senão resolve no Chrome…',
      );
      const t0 = Date.now();
      let n = 0;
      let clickedNotRobot = false;
      while (true) {
        const hit = await s.evaluate(FIND_NOT_ROBOT);
        if (hit?.x && hit?.y) {
          console.error(
            `[after-name] clique "Não sou um robô" (${hit.via}: ${hit.label}) @ ${hit.x},${hit.y}`,
          );
          await s.clickAt(hit.x, hit.y);
          clickedNotRobot = true;
          await sleep(2500);
        }

        await sleep(pollMs);
        st = await s.evaluate(SNAP);
        n += 1;
        if (!st.hasSecurity && (st.nextScreen || !st.stillName)) {
          console.error(
            `[after-name] verificação ok após ${Math.round((Date.now() - t0) / 1000)}s — ${st.href}`,
          );
          await sleep(1500);
          break;
        }
        if (n % 6 === 0) {
          console.error(
            `[after-name] ainda em verificação humana… ${Math.round((Date.now() - t0) / 1000)}s` +
              (clickedNotRobot ? ' (já clicou não-robô)' : ''),
          );
        }
      }
      return {
        id,
        waited: true,
        security: true,
        clickedNotRobot,
        waitedMs: Date.now() - t0,
        href: st.href,
        body: st.body,
      };
    }

    // sem hasSecurity flag — ainda tenta o checkbox se o texto estiver na página
    const hit = await s.evaluate(FIND_NOT_ROBOT);
    if (hit?.x && hit?.y) {
      console.error(
        `[after-name] clique "Não sou um robô" (${hit.via}: ${hit.label}) @ ${hit.x},${hit.y}`,
      );
      await s.clickAt(hit.x, hit.y);
      await sleep(2500);
      st = await s.evaluate(SNAP);
    }

    if (st.nextScreen) {
      console.error(`[after-name] próxima tela — ${st.href}`);
      return {
        id,
        waited: false,
        security: false,
        href: st.href,
        body: st.body,
      };
    }

    console.error(`[after-name] seguindo (estado: ${st.href})`);
    return {
      id,
      waited: false,
      security: false,
      href: st.href,
      body: st.body,
    };
  } finally {
    s.close();
  }
}
