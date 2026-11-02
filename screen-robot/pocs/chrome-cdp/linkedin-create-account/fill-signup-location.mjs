/**
 * Preenche localidade no onboarding LinkedIn: clica → digita (só cidade) → 1ª opção → Continuar.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/** Remove ", Brasil" / país do final — só o nome da cidade (e UF se vier). */
export function cityOnly(location) {
  return String(location || '')
    .replace(/\s*,\s*(brasil|brazil)\s*$/i, '')
    .trim();
}

/**
 * @param {{ id: string, location: string, dryRun?: boolean }} opts
 */
export async function fillSignupLocation(opts = {}) {
  const id = String(opts.id || '').trim();
  const location = cityOnly(opts.location);
  if (!id) throw new Error('fillSignupLocation: id obrigatório');
  if (!location) throw new Error('fillSignupLocation: location obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, location, filled: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const marked = await s.evaluate(`(() => {
      const re = /local|cidade|location|ex\\.:|são paulo|vaga|trabalhar/i;
      const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),textarea')]
        .filter((el) => el.offsetWidth);
      let el =
        inputs.find((i) =>
          re.test(
            [i.placeholder, i.getAttribute('aria-label'), i.name, i.id].join(' '),
          ),
        ) || inputs[0];
      if (!el) return null;
      document.querySelectorAll('[data-hcdp=loc]').forEach((e) => e.removeAttribute('data-hcdp'));
      el.setAttribute('data-hcdp', 'loc');
      return {
        id: el.id,
        ph: el.placeholder || '',
        aria: el.getAttribute('aria-label') || '',
      };
    })()`);
    if (!marked) throw new Error('campo localidade ausente');

    await s.click('[data-hcdp=loc]');
    await sleep(250);
    await s.fill('[data-hcdp=loc]', location);
    await sleep(2200);

    let opt = await s.evaluate(`(() => {
      const opts = [...document.querySelectorAll('[role=option]')].filter((el) => el.offsetWidth);
      if (!opts.length) return null;
      document.querySelectorAll('[data-hcdp=loc-opt]').forEach((e) => e.removeAttribute('data-hcdp'));
      opts[0].setAttribute('data-hcdp', 'loc-opt');
      return (opts[0].innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120);
    })()`);

    if (opt) {
      await s.click('[data-hcdp=loc-opt]');
    } else {
      // fallback: seta para baixo + Enter (typeahead LinkedIn)
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
      await sleep(400);
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
      opt = '(arrow+enter)';
    }
    await sleep(900);

    const cont = await s.evaluate(`(() => {
      const re = /^continuar$|^continue$|^next$|avan[cç]ar/i;
      document.querySelectorAll('[data-hcdp=loc-continue]').forEach((e) => e.removeAttribute('data-hcdp'));
      for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
        if (!el.offsetWidth && !el.getClientRects().length) continue;
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (re.test(t)) {
          el.setAttribute('data-hcdp', 'loc-continue');
          return t.slice(0, 80);
        }
      }
      return null;
    })()`);
    if (!cont) throw new Error('botão Continuar ausente após localidade');

    await s.click('[data-hcdp=loc-continue]');
    await sleep(3000);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 200),
      value: (document.querySelector('[data-hcdp=loc]') || document.querySelector('input[type=text]'))?.value || '',
    }))()`);

    return {
      id,
      location,
      picked: opt,
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
