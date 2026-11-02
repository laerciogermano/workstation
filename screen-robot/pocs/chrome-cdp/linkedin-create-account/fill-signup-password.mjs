/**
 * Preenche a senha no formulário de signup LinkedIn (human-cdp).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, password: string, dryRun?: boolean }} opts
 */
export async function fillSignupPassword(opts = {}) {
  const id = String(opts.id || '').trim();
  const password = String(opts.password || '').trim();
  if (!id) throw new Error('fillSignupPassword: id obrigatório');
  if (!password) throw new Error('fillSignupPassword: password obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, filled: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const marked = await s.evaluate(`(() => {
      const el =
        document.querySelector('#password') ||
        document.querySelector('input[name="password"]') ||
        document.querySelector('input[type="password"]');
      if (!el) return null;
      document.querySelectorAll('[data-hcdp=password]').forEach((e) => e.removeAttribute('data-hcdp'));
      el.setAttribute('data-hcdp', 'password');
      return { id: el.id, name: el.name, type: el.type };
    })()`);
    if (!marked) throw new Error('campo password ausente no signup');

    await s.click('[data-hcdp=password]');
    await sleep(200);
    await s.fill('[data-hcdp=password]', password);
    await sleep(400);

    const value = await s.evaluate(`(() => {
      const el = document.querySelector('[data-hcdp=password]') || document.querySelector('#password');
      return el?.value || '';
    })()`);

    if (value !== password) {
      throw new Error('password não ficou no campo');
    }

    return { id, filled: true };
  } finally {
    s.close();
  }
}
