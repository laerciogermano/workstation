/**
 * Fecha o onboarding LinkedIn de forma adaptativa:
 * choice (ex. "não estou procurando") → Pular → Concluir → Continuar até /feed.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const SNAP = `(() => {
  const href = location.href;
  const body = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const labelOf = (el) =>
    (el.innerText || el.value || el.getAttribute('aria-label') || '')
      .replace(/\\s+/g, ' ')
      .trim();

  document.querySelectorAll('[data-hcdp^=ob-]').forEach((el) => {
    [...el.attributes]
      .filter((a) => a.name.startsWith('data-hcdp'))
      .forEach((a) => el.removeAttribute(a.name));
  });

  const nodes = [...document.querySelectorAll('button, a, [role=button]')].filter(visible);

  const markBest = (re, attr, preferButton = true) => {
    const cands = nodes
      .map((el) => ({ el, t: labelOf(el) }))
      .filter((x) => x.t && x.t.length <= 40 && re.test(x.t) && !x.el.disabled);
    if (!cands.length) return null;
    cands.sort((a, b) => {
      let sa = a.t.length;
      let sb = b.t.length;
      if (preferButton) {
        if (a.el.tagName === 'BUTTON') sa -= 100;
        if (b.el.tagName === 'BUTTON') sb -= 100;
      }
      const ra = a.el.getBoundingClientRect();
      const rb = b.el.getBoundingClientRect();
      sa -= Math.min(50, Math.floor(ra.y / 15));
      sb -= Math.min(50, Math.floor(rb.y / 15));
      return sa - sb;
    });
    cands[0].el.setAttribute('data-hcdp', attr);
    return { label: cands[0].t.slice(0, 80), tag: cands[0].el.tagName };
  };

  // tela "Você está procurando emprego?" — preferir Não
  let choice = null;
  const isJobSeeker =
    /job-seeker-intent|procurando emprego|looking for (a )?job/i.test(href + ' ' + body);
  if (isJobSeeker) {
    const choiceNodes = [
      ...document.querySelectorAll(
        'button, [role=button], [role=radio], label, li, div[tabindex], input[type=radio]',
      ),
    ].filter(visible);
    const reNao =
      /^n[aã]o(\\s|$)|n[aã]o estou procurando|^no[,.]?\\s*(i'?m )?not looking|not looking for/i;
    const cands = choiceNodes
      .map((el) => ({ el, t: labelOf(el) }))
      .filter((x) => x.t && x.t.length <= 90 && reNao.test(x.t));
    cands.sort((a, b) => a.t.length - b.t.length);
    if (cands.length) {
      cands[0].el.setAttribute('data-hcdp', 'ob-choice');
      choice = { label: cands[0].t.slice(0, 80), tag: cands[0].el.tagName };
    }
  }

  const skip = markBest(/^pular$|^skip$|agora n[aã]o|^not now$/i, 'ob-skip');
  const finish = markBest(/^concluir$|^done$|^finish$|^fechar$|^got it$/i, 'ob-finish');
  const cont = markBest(/^continuar$|^continue$|^next$/i, 'ob-continue');

  return {
    href,
    body: body.slice(0, 180),
    onFeed: /\\/feed\\/?/i.test(href) && !/onboarding/i.test(href),
    choice,
    skip,
    finish,
    cont,
  };
})()`;

/**
 * @param {{ id: string, dryRun?: boolean, maxSteps?: number }} opts
 */
export async function finishSignupOnboarding(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('finishSignupOnboarding: id obrigatório');
  const maxSteps = Number(opts.maxSteps) > 0 ? Number(opts.maxSteps) : 25;

  if (opts.dryRun) {
    return { dryRun: true, id, steps: [] };
  }

  const s = await connectCdp(id, { debug: true });
  const steps = [];
  try {
    for (let i = 0; i < maxSteps; i++) {
      const st = await s.evaluate(SNAP);
      if (st.onFeed) {
        console.error(`[onboarding] /feed ok após ${steps.length} passo(s)`);
        return { id, steps, href: st.href, body: st.body, done: true };
      }

      // prioridade: choice (job-seeker) → Pular → Concluir → Continuar
      let action = null;
      let sel = null;
      let label = null;
      if (st.choice) {
        action = 'Choice';
        sel = '[data-hcdp=ob-choice]';
        label = st.choice.label;
      } else if (st.skip) {
        action = 'Pular';
        sel = '[data-hcdp=ob-skip]';
        label = st.skip.label;
      } else if (st.finish) {
        action = 'Concluir';
        sel = '[data-hcdp=ob-finish]';
        label = st.finish.label;
      } else if (st.cont) {
        action = 'Continuar';
        sel = '[data-hcdp=ob-continue]';
        label = st.cont.label;
      }

      if (!action) {
        console.error(`[onboarding] sem ação em ${st.href} — body: ${st.body}`);
        return { id, steps, href: st.href, body: st.body, done: false };
      }

      console.error(`[onboarding] ${i + 1}/${maxSteps} ${action} (${label}) @ ${st.href}`);
      await s.click(sel);
      await sleep(action === 'Choice' ? 1200 : 2800);
      steps.push({ action, from: st.href, label });
    }

    const last = await s.evaluate(SNAP);
    return {
      id,
      steps,
      href: last.href,
      body: last.body,
      done: !!last.onFeed,
    };
  } finally {
    s.close();
  }
}
