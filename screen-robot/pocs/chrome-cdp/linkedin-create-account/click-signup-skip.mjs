/**
 * Clica em Pular / Skip no onboarding LinkedIn.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean }} opts
 */
export async function clickSignupSkip(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupSkip: id obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const hit = await s.evaluate(`(() => {
      const re = /^pular$|^skip$|agora n[aã]o|^not now$/i;
      document.querySelectorAll('[data-hcdp=skip]').forEach((e) => e.removeAttribute('data-hcdp'));
      const nodes = [
        ...document.querySelectorAll('button, [role=button], a, input[type=submit], span, div'),
      ].filter((el) => el.offsetWidth || el.getClientRects().length);
      let best = null;
      let bestLen = Infinity;
      for (const el of nodes) {
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (!t || t.length > 40) continue;
        if (!re.test(t)) continue;
        if (t.length < bestLen) {
          best = el;
          bestLen = t.length;
        }
      }
      if (!best) return null;
      best.setAttribute('data-hcdp', 'skip');
      return (best.innerText || best.getAttribute('aria-label') || '')
        .replace(/\\s+/g, ' ')
        .trim()
        .slice(0, 80);
    })()`);
    if (!hit) throw new Error('botão Pular ausente');

    await s.click('[data-hcdp=skip]');
    await sleep(3000);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220),
    }))()`);

    return { id, clicked: true, label: hit, href: after.href, body: after.body };
  } finally {
    s.close();
  }
}
