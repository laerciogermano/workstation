/**
 * Preenche nome e sobrenome no signup LinkedIn (human-cdp).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, first: string, last: string, dryRun?: boolean }} opts
 */
export async function fillSignupName(opts = {}) {
  const id = String(opts.id || '').trim();
  const first = String(opts.first || opts.nome || '').trim();
  const last = String(opts.last || opts.sobrenome || '').trim();
  if (!id) throw new Error('fillSignupName: id obrigatório');
  if (!first || !last) throw new Error('fillSignupName: first e last obrigatórios');

  if (opts.dryRun) {
    return { dryRun: true, id, first, last, filled: false };
  }

  const s = await connectCdp(id);
  try {
    const marked = await s.evaluate(`(() => {
      const firstEl =
        document.querySelector('#first-name') ||
        document.querySelector('input[name="first-name"]') ||
        document.querySelector('input[id*="first" i]');
      const lastEl =
        document.querySelector('#last-name') ||
        document.querySelector('input[name="last-name"]') ||
        document.querySelector('input[id*="last" i]');
      if (!firstEl || !lastEl) return null;
      document.querySelectorAll('[data-hcdp=first],[data-hcdp=last]').forEach((e) => {
        e.removeAttribute('data-hcdp');
      });
      firstEl.setAttribute('data-hcdp', 'first');
      lastEl.setAttribute('data-hcdp', 'last');
      return { firstId: firstEl.id, lastId: lastEl.id };
    })()`);
    if (!marked) throw new Error('campos nome/sobrenome ausentes');

    await s.click('[data-hcdp=first]');
    await sleep(200);
    await s.fill('[data-hcdp=first]', first);
    await sleep(300);

    await s.click('[data-hcdp=last]');
    await sleep(200);
    await s.fill('[data-hcdp=last]', last);
    await sleep(400);

    const values = await s.evaluate(`(() => {
      const f = document.querySelector('[data-hcdp=first]') || document.querySelector('#first-name');
      const l = document.querySelector('[data-hcdp=last]') || document.querySelector('#last-name');
      return { first: f?.value || '', last: l?.value || '' };
    })()`);

    if (values.first !== first || values.last !== last) {
      throw new Error(`nome não ficou no campo (got=${JSON.stringify(values)})`);
    }

    return { id, first, last, filled: true };
  } finally {
    s.close();
  }
}
