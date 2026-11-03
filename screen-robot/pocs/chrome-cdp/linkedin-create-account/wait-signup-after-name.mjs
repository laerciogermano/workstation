/**
 * Após nome+Continuar: detecta verificação humana vs próxima tela.
 * Se houver captcha/segurança, espera indeterminadamente até a próxima tela.
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
  const securityText = /verifica[cç][aã]o de seguran[cç]a|security (check|verification)|confirma que voc[eê] [eé] humano|confirm you.?re human|captcha/i.test(
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

  const s = await connectCdp(id);
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
        '[after-name] VERIFICAÇÃO HUMANA — resolva no Chrome; script espera sem timeout…',
      );
      const t0 = Date.now();
      let n = 0;
      while (true) {
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
            `[after-name] ainda em verificação humana… ${Math.round((Date.now() - t0) / 1000)}s`,
          );
        }
      }
      return {
        id,
        waited: true,
        security: true,
        waitedMs: Date.now() - t0,
        href: st.href,
        body: st.body,
      };
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
