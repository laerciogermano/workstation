/**
 * Onboarding LinkedIn: "Sim, sou maior de 18" → Continuar.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean }} opts
 */
export async function clickSignupAge18(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupAge18: id obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const marked = await s.evaluate(`(() => {
      document.querySelectorAll('[data-hcdp=age18]').forEach((e) => e.removeAttribute('data-hcdp'));
      const re = /^sim[,.]?\\s*.*maior\\s*de\\s*18|^yes[,.]?\\s*.*(over|older)\\s*18/i;
      const nodes = [...document.querySelectorAll('button,[role=button],[role=radio],label,div,span,li')]
        .filter((el) => el.offsetWidth || el.getClientRects().length);
      let best = null;
      let bestLen = Infinity;
      for (const el of nodes) {
        const t = (el.innerText || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (!t || t.length > 80) continue;
        if (!re.test(t)) continue;
        if (t.length < bestLen) {
          best = el;
          bestLen = t.length;
        }
      }
      if (!best) return null;
      best.setAttribute('data-hcdp', 'age18');
      return {
        tag: best.tagName,
        t: (best.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
      };
    })()`);
    if (!marked) throw new Error('opção "maior de 18" ausente');

    await s.click('[data-hcdp=age18]');
    await sleep(800);

    const cont = await s.evaluate(`(() => {
      const re = /^continuar$|^continue$|^next$/i;
      document.querySelectorAll('[data-hcdp=age18-continue]').forEach((e) =>
        e.removeAttribute('data-hcdp'),
      );
      for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
        if (!el.offsetWidth && !el.getClientRects().length) continue;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (re.test(t)) {
          el.setAttribute('data-hcdp', 'age18-continue');
          return t.slice(0, 80);
        }
      }
      return null;
    })()`);
    if (!cont) throw new Error('botão Continuar ausente/desabilitado após idade 18');

    await s.click('[data-hcdp=age18-continue]');
    await sleep(3000);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220),
    }))()`);

    return {
      id,
      clicked: marked.t,
      continue: cont,
      href: after.href,
      body: after.body,
    };
  } finally {
    s.close();
  }
}
