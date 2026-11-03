/**
 * Fecha o onboarding LinkedIn de forma adaptativa:
 * choice (job-seeker) → Pular (sempre que existir) → Concluir → Continuar até /feed.
 * Clique por coordenadas (sem waitFor de data-hcdp) — evita timeout na tela de foto.
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
  const point = (el) => {
    const r = el.getBoundingClientRect();
    return {
      label: labelOf(el).slice(0, 80),
      tag: el.tagName,
      x: Math.round(r.x + r.width / 2),
      y: Math.round(r.y + r.height / 2),
    };
  };

  const markBest = (nodes, re, { preferButton = true, maxLen = 40 } = {}) => {
    const cands = nodes
      .map((el) => ({ el, t: labelOf(el) }))
      .filter(
        (x) =>
          x.t &&
          x.t.length <= maxLen &&
          re.test(x.t) &&
          !x.el.disabled &&
          x.el.getAttribute('aria-disabled') !== 'true',
      );
    if (!cands.length) return null;
    cands.sort((a, b) => {
      let sa = a.t.length;
      let sb = b.t.length;
      if (preferButton) {
        if (a.el.tagName === 'BUTTON') sa -= 200;
        else if (a.el.getAttribute('role') === 'button') sa -= 160;
        else if (a.el.tagName === 'A') sa -= 20;
        if (b.el.tagName === 'BUTTON') sb -= 200;
        else if (b.el.getAttribute('role') === 'button') sb -= 160;
        else if (b.el.tagName === 'A') sb -= 20;
      }
      const ra = a.el.getBoundingClientRect();
      const rb = b.el.getBoundingClientRect();
      // preferir centro/baixo (modal) vs header
      sa -= Math.min(80, Math.floor(ra.y / 10));
      sb -= Math.min(80, Math.floor(rb.y / 10));
      return sa - sb;
    });
    return point(cands[0].el);
  };

  const btnNodes = [
    ...document.querySelectorAll('button, a, [role=button], span, div'),
  ].filter(visible);

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
    if (cands.length) choice = point(cands[0].el);
  }

  // Pular: sempre prioridade quando existir (foto, people, follow, modal)
  const skip = markBest(btnNodes, /^pular$|^skip$|agora n[aã]o|^not now$/i);
  const finish = markBest(
    btnNodes,
    /^concluir$|^done$|^finish$|^fechar$|^got it$/i,
  );
  const cont = markBest(btnNodes, /^continuar$|^continue$|^next$/i);

  return {
    href,
    body: body.slice(0, 180),
    onFeed: /\\/feed\\/?/i.test(href) && !/onboarding/i.test(href),
    isPhoto: /profile-photo|adicionar? (sua )?foto|add (a )?photo|upload.*photo/i.test(
      href + ' ' + body,
    ),
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

      // prioridade: choice → Pular (sempre, incl. foto) → Concluir → Continuar
      let action = null;
      let target = null;
      if (st.choice) {
        action = 'Choice';
        target = st.choice;
      } else if (st.skip) {
        action = 'Pular';
        target = st.skip;
      } else if (st.finish) {
        action = 'Concluir';
        target = st.finish;
      } else if (st.cont) {
        action = 'Continuar';
        target = st.cont;
      }

      if (!action || !target?.x || !target?.y) {
        console.error(`[onboarding] sem ação em ${st.href} — body: ${st.body}`);
        return { id, steps, href: st.href, body: st.body, done: false };
      }

      console.error(
        `[onboarding] ${i + 1}/${maxSteps} ${action} (${target.label}) @ ${st.href}` +
          (st.isPhoto ? ' [foto]' : ''),
      );
      await s.clickAt(target.x, target.y);
      await sleep(action === 'Choice' ? 1200 : 2800);
      steps.push({ action, from: st.href, label: target.label });
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
