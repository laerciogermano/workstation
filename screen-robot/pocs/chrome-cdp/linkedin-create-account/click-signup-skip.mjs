/**
 * Clica em Pular / Skip no onboarding LinkedIn (botão preferido; repete se modal).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean, maxClicks?: number }} opts
 */
export async function clickSignupSkip(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupSkip: id obrigatório');
  const maxClicks = Number(opts.maxClicks) > 0 ? Number(opts.maxClicks) : 3;

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const clicks = [];
    let after = null;

    for (let n = 0; n < maxClicks; n++) {
      const hit = await s.evaluate(`(() => {
        const re = /^pular$|^skip$|agora n[aã]o|^not now$/i;
        document.querySelectorAll('[data-hcdp=skip]').forEach((e) => e.removeAttribute('data-hcdp'));
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
        };
        const score = (el, t) => {
          const tag = el.tagName;
          let s = t.length;
          if (tag === 'BUTTON') s -= 100;
          else if (el.getAttribute('role') === 'button') s -= 80;
          else if (tag === 'A') s -= 40;
          // preferir centro/modal (y maior) a header
          const r = el.getBoundingClientRect();
          s -= Math.min(40, Math.floor(r.y / 20));
          return s;
        };
        const cands = [
          ...document.querySelectorAll('button, a, [role=button], span, div'),
        ]
          .filter(visible)
          .map((el) => {
            const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
              .replace(/\\s+/g, ' ')
              .trim();
            return { el, t };
          })
          .filter((x) => x.t && x.t.length <= 40 && re.test(x.t));
        if (!cands.length) return null;
        cands.sort((a, b) => score(a.el, a.t) - score(b.el, b.t));
        const best = cands[0];
        best.el.setAttribute('data-hcdp', 'skip');
        const r = best.el.getBoundingClientRect();
        return {
          label: best.t.slice(0, 80),
          tag: best.el.tagName,
          y: Math.round(r.y),
        };
      })()`);

      if (!hit) {
        if (!clicks.length) throw new Error('botão Pular ausente');
        break;
      }

      await s.click('[data-hcdp=skip]');
      clicks.push(hit);
      await sleep(2500);

      after = await s.evaluate(`(() => ({
        href: location.href,
        body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220),
        stillIntent: /job-seeker-intent|interesse em novas oportunidades|looking for job/i.test(
          location.href + ' ' + (document.body?.innerText || ''),
        ),
        hasSkip: [...document.querySelectorAll('button,a,[role=button]')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          })
          .some((el) =>
            /^pular$|^skip$/i.test(
              (el.innerText || el.getAttribute('aria-label') || '')
                .replace(/\\s+/g, ' ')
                .trim(),
            ),
          ),
      }))()`);

      // saiu do passo de intenção / modal fechado sem novo Pular crítico
      if (!after.stillIntent || !after.hasSkip) break;
    }

    if (!clicks.length) throw new Error('botão Pular ausente');

    return {
      id,
      clicked: true,
      clicks,
      label: clicks[clicks.length - 1].label,
      href: after?.href,
      body: after?.body,
    };
  } finally {
    s.close();
  }
}
