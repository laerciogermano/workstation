/**
 * Preenche o e-mail no formulário de signup LinkedIn (human-cdp).
 * Espera o campo aparecer (página pode demorar após startCdp).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const FIND_EMAIL = `(() => {
  const el =
    document.querySelector('#email-or-phone') ||
    document.querySelector('input[name="email-or-phone"]') ||
    document.querySelector('input[type="email"]') ||
    [...document.querySelectorAll('input')].find((i) =>
      /e-?mail|telefone|phone/i.test(
        [i.placeholder, i.getAttribute('aria-label'), i.name, i.id].join(' '),
      ),
    );
  if (!el || !(el.offsetWidth || el.getClientRects().length)) return null;
  document.querySelectorAll('[data-hcdp=email]').forEach((e) => e.removeAttribute('data-hcdp'));
  el.setAttribute('data-hcdp', 'email');
  return { id: el.id, name: el.name, href: location.href };
})()`;

/**
 * @param {{ id: string, email: string, dryRun?: boolean, timeoutMs?: number }} opts
 */
export async function fillSignupEmail(opts = {}) {
  const id = String(opts.id || '').trim();
  const email = String(opts.email || '').trim();
  if (!id) throw new Error('fillSignupEmail: id obrigatório');
  if (!email) throw new Error('fillSignupEmail: email obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, email, filled: false };
  }

  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 60_000;
  const s = await connectCdp(id, { debug: true });
  try {
    const t0 = Date.now();
    let marked = null;
    let attempt = 0;
    while (Date.now() - t0 < timeoutMs) {
      attempt += 1;
      marked = await s.evaluate(FIND_EMAIL);
      if (marked) break;
      if (attempt === 1 || attempt % 5 === 0) {
        console.error(
          `[fill-email] aguardando #email-or-phone… (${Math.round((Date.now() - t0) / 1000)}s)`,
        );
      }
      // se cair em chrome-error / outra URL, tenta signup de novo
      const href = await s.evaluate(`(() => location.href)`);
      if (!/linkedin\.com\/signup/i.test(String(href || ''))) {
        console.error(`[fill-email] URL inesperada (${href}) — indo para /signup`);
        await s.goto('https://www.linkedin.com/signup');
        await sleep(2000);
      }
      await sleep(1000);
    }
    if (!marked) throw new Error('campo email ausente no signup');

    await s.click('[data-hcdp=email]');
    await sleep(200);
    await s.fill('[data-hcdp=email]', email);
    await sleep(400);

    const value = await s.evaluate(`(() => {
      const el = document.querySelector('[data-hcdp=email]') || document.querySelector('#email-or-phone');
      return el?.value || '';
    })()`);

    if (value !== email) {
      throw new Error(`email não ficou no campo (got=${JSON.stringify(value)})`);
    }

    return { id, email, filled: true, href: marked.href };
  } finally {
    s.close();
  }
}
