/**
 * Preenche o e-mail no formulário de signup LinkedIn (human-cdp).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, email: string, dryRun?: boolean }} opts
 */
export async function fillSignupEmail(opts = {}) {
  const id = String(opts.id || '').trim();
  const email = String(opts.email || '').trim();
  if (!id) throw new Error('fillSignupEmail: id obrigatório');
  if (!email) throw new Error('fillSignupEmail: email obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, email, filled: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const marked = await s.evaluate(`(() => {
      const el =
        document.querySelector('#email-or-phone') ||
        document.querySelector('input[name="email-or-phone"]') ||
        document.querySelector('input[type="email"]');
      if (!el) return null;
      document.querySelectorAll('[data-hcdp=email]').forEach((e) => e.removeAttribute('data-hcdp'));
      el.setAttribute('data-hcdp', 'email');
      return { id: el.id, name: el.name };
    })()`);
    if (!marked) throw new Error('campo email ausente no signup');

    await s.click('[data-hcdp=email]');
    await sleep(200);
    await s.fill('[data-hcdp=email]', email);
    await sleep(400);

    const value = await s.evaluate(`(() => {
      const el = document.querySelector('[data-hcdp=email]') || document.querySelector('#email-or-phone');
      return el?.value || '';
    })()`);

    if (value !== email) {
      throw new Error(`email não ficou no campo (got=${JSON.stringify(value)})`);
    }

    return { id, email, filled: true };
  } finally {
    s.close();
  }
}
