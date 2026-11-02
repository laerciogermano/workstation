/**
 * Clica em "Aceite e cadastre-se" no signup LinkedIn (human-cdp).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean }} opts
 */
export async function clickSignupSubmit(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupSubmit: id obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const hit = await s.evaluate(`(() => {
      const re = /aceite\\s*e\\s*cadastre|aceitar\\s*e\\s*cadastrar|join\\s*now|agree\\s*&\\s*join|continuar|continue/i;
      document.querySelectorAll('[data-hcdp=submit]').forEach((e) => e.removeAttribute('data-hcdp'));
      for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
        if (!el.offsetWidth && !el.getClientRects().length) continue;
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (re.test(t)) {
          el.setAttribute('data-hcdp', 'submit');
          return t.slice(0, 80);
        }
      }
      return null;
    })()`);
    if (!hit) throw new Error('botão Aceite e cadastre-se ausente');

    await s.click('[data-hcdp=submit]');
    await sleep(2500);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 160),
    }))()`);

    return { id, clicked: true, label: hit, href: after.href, body: after.body };
  } finally {
    s.close();
  }
}
