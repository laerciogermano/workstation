/**
 * Clica em Concluir / Done no onboarding LinkedIn.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean }} opts
 */
export async function clickSignupFinish(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupFinish: id obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const hit = await s.evaluate(`(() => {
      const re = /^concluir$|^done$|^finish$|^fechar$|^got it$|^ok$/i;
      document.querySelectorAll('[data-hcdp=finish]').forEach((e) => e.removeAttribute('data-hcdp'));
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const score = (el) => {
        let s = 0;
        if (el.tagName === 'BUTTON') s -= 100;
        else if (el.getAttribute('role') === 'button') s -= 80;
        s -= Math.min(40, Math.floor(el.getBoundingClientRect().y / 20));
        return s;
      };
      const cands = [...document.querySelectorAll('button, a, [role=button], span')]
        .filter(visible)
        .map((el) => {
          const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
            .replace(/\\s+/g, ' ')
            .trim();
          return { el, t };
        })
        .filter((x) => x.t && x.t.length <= 30 && re.test(x.t));
      if (!cands.length) return null;
      cands.sort((a, b) => score(a.el) - score(b.el));
      cands[0].el.setAttribute('data-hcdp', 'finish');
      return cands[0].t.slice(0, 80);
    })()`);
    if (!hit) throw new Error('botão Concluir ausente');

    await s.click('[data-hcdp=finish]');
    await sleep(3500);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220),
    }))()`);

    return { id, clicked: true, label: hit, href: after.href, body: after.body };
  } finally {
    s.close();
  }
}
