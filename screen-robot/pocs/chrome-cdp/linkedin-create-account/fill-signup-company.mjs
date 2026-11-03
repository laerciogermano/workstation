/**
 * Preenche a empresa no onboarding LinkedIn (typeahead + 1ª opção se houver) e Continuar.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, company: string, dryRun?: boolean }} opts
 */
export async function fillSignupCompany(opts = {}) {
  const id = String(opts.id || '').trim();
  const company = String(opts.company || opts.empresa || '').trim();
  if (!id) throw new Error('fillSignupCompany: id obrigatório');
  if (!company) throw new Error('fillSignupCompany: company obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, company, filled: false };
  }

  const s = await connectCdp(id);
  try {
    const marked = await s.evaluate(`(() => {
      const re = /empresa|company|empregador|organiza/i;
      const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),textarea')]
        .filter((el) => el.offsetWidth);
      let el =
        inputs.find((i) =>
          re.test(
            [i.placeholder, i.getAttribute('aria-label'), i.name, i.id].join(' '),
          ),
        ) || null;
      // se cargo já preenchido, pegar o input vazio restante
      if (!el) {
        el = inputs.find((i) => !String(i.value || '').trim()) || inputs[inputs.length - 1];
      }
      if (!el) return null;
      document.querySelectorAll('[data-hcdp=company]').forEach((e) => e.removeAttribute('data-hcdp'));
      el.setAttribute('data-hcdp', 'company');
      return {
        id: el.id,
        aria: el.getAttribute('aria-label') || '',
        ph: el.placeholder || '',
      };
    })()`);
    if (!marked) throw new Error('campo empresa ausente');

    await s.click('[data-hcdp=company]');
    await sleep(250);
    await s.fill('[data-hcdp=company]', company);
    await sleep(1800);

    let picked = null;
    const opt = await s.evaluate(`(() => {
      const opts = [...document.querySelectorAll('[role=option]')].filter((el) => el.offsetWidth);
      if (!opts.length) return null;
      document.querySelectorAll('[data-hcdp=co-opt]').forEach((e) => e.removeAttribute('data-hcdp'));
      opts[0].setAttribute('data-hcdp', 'co-opt');
      return (opts[0].innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120);
    })()`);

    if (opt) {
      await s.click('[data-hcdp=co-opt]');
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

    const cont = await s.evaluate(`(() => {
      const re = /^continuar$|^continue$|^next$|avan[cç]ar/i;
      document.querySelectorAll('[data-hcdp=co-continue]').forEach((e) => e.removeAttribute('data-hcdp'));
      for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
        if (!el.offsetWidth && !el.getClientRects().length) continue;
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (re.test(t)) {
          el.setAttribute('data-hcdp', 'co-continue');
          return t.slice(0, 80);
        }
      }
      return null;
    })()`);
    if (!cont) throw new Error('botão Continuar ausente após empresa');

    await s.click('[data-hcdp=co-continue]');
    await sleep(3000);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 200),
      value: document.querySelector('[data-hcdp=company]')?.value || '',
    }))()`);

    return {
      id,
      company,
      picked,
      continue: cont,
      filled: true,
      href: after.href,
      body: after.body,
      value: after.value,
    };
  } finally {
    s.close();
  }
}
