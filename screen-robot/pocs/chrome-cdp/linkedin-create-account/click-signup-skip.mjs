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

  const s = await connectCdp(id);
  try {
    const clicks = [];
    let after = null;
    const startHref = await s.evaluate(`(() => location.href)`);

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
          // botão/modal no centro > link Pular do header
          if (tag === 'BUTTON') s -= 200;
          else if (el.getAttribute('role') === 'button') s -= 160;
          else if (tag === 'A') s -= 20;
          const r = el.getBoundingClientRect();
          s -= Math.min(80, Math.floor(r.y / 10));
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

      after = await s.evaluate(`((startHref) => {
        const href = location.href;
        const body = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
        const hasButtonSkip = [...document.querySelectorAll('button, [role=button]')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.y > 80;
          })
          .some((el) =>
            /^pular$|^skip$/i.test(
              (el.innerText || el.getAttribute('aria-label') || '')
                .replace(/\\s+/g, ' ')
                .trim(),
            ),
          );
        return {
          href,
          body: body.slice(0, 220),
          sameStep: href === startHref,
          hasButtonSkip,
        };
      })(${JSON.stringify(startHref)})`);

      // avançou de URL, ou só resta Pular do header
      if (!after.sameStep || !after.hasButtonSkip) break;
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
