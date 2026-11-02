/**
 * Clica em Continuar no signup LinkedIn (após nome/sobrenome).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean }} opts
 */
export async function clickSignupContinue(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupContinue: id obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const hit = await s.evaluate(`(() => {
      const re = /^continuar$|^continue$|^next$|avan[cç]ar/i;
      document.querySelectorAll('[data-hcdp=continue]').forEach((e) => e.removeAttribute('data-hcdp'));
      for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
        if (!el.offsetWidth && !el.getClientRects().length) continue;
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (re.test(t)) {
          el.setAttribute('data-hcdp', 'continue');
          return t.slice(0, 80);
        }
      }
      return null;
    })()`);
    if (!hit) throw new Error('botão Continuar ausente');

    await s.click('[data-hcdp=continue]');
    await sleep(3000);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 200),
    }))()`);

    return { id, clicked: true, label: hit, href: after.href, body: after.body };
  } finally {
    s.close();
  }
}
