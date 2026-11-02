/**
 * Preenche o cargo no onboarding LinkedIn (typeahead + 1ª opção se houver).
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, job: string, dryRun?: boolean }} opts
 */
export async function fillSignupJob(opts = {}) {
  const id = String(opts.id || '').trim();
  const job = String(opts.job || opts.cargo || '').trim();
  if (!id) throw new Error('fillSignupJob: id obrigatório');
  if (!job) throw new Error('fillSignupJob: job obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, job, filled: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const marked = await s.evaluate(`(() => {
      const re = /cargo|t[ií]tulo|title|job|fun[cç][aã]o/i;
      const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),textarea')]
        .filter((el) => el.offsetWidth);
      let el =
        inputs.find((i) =>
          re.test(
            [i.placeholder, i.getAttribute('aria-label'), i.name, i.id].join(' '),
          ),
        ) || inputs[0];
      if (!el) return null;
      document.querySelectorAll('[data-hcdp=job]').forEach((e) => e.removeAttribute('data-hcdp'));
      el.setAttribute('data-hcdp', 'job');
      return {
        id: el.id,
        aria: el.getAttribute('aria-label') || '',
        ph: el.placeholder || '',
      };
    })()`);
    if (!marked) throw new Error('campo cargo ausente');

    await s.click('[data-hcdp=job]');
    await sleep(250);
    await s.fill('[data-hcdp=job]', job);
    await sleep(1800);

    let picked = null;
    const opt = await s.evaluate(`(() => {
      const opts = [...document.querySelectorAll('[role=option]')].filter((el) => el.offsetWidth);
      if (!opts.length) return null;
      document.querySelectorAll('[data-hcdp=job-opt]').forEach((e) => e.removeAttribute('data-hcdp'));
      opts[0].setAttribute('data-hcdp', 'job-opt');
      return (opts[0].innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120);
    })()`);

    if (opt) {
      await s.click('[data-hcdp=job-opt]');
      picked = opt;
      await sleep(700);
    } else {
      await s.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'ArrowDown',
        code: 'ArrowDown',
        windowsVirtualKeyCode: 40,
      });
      await s.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'ArrowDown',
        code: 'ArrowDown',
        windowsVirtualKeyCode: 40,
      });
      await sleep(350);
      await s.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      });
      await s.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      });
      picked = '(arrow+enter)';
      await sleep(700);
    }

    const value = await s.evaluate(`(() => {
      const el = document.querySelector('[data-hcdp=job]');
      return el?.value || '';
    })()`);

    return { id, job, picked, value, filled: true };
  } finally {
    s.close();
  }
}
