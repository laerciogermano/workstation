/**
 * Preenche o PIN de 6 dígitos no onboarding LinkedIn e clica Continuar.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, code: string, dryRun?: boolean }} opts
 */
export async function fillSignupPin(opts = {}) {
  const id = String(opts.id || '').trim();
  const code = String(opts.code || opts.pin || '').trim();
  if (!id) throw new Error('fillSignupPin: id obrigatório');
  if (!/^\d{6}$/.test(code)) throw new Error('fillSignupPin: code deve ter 6 dígitos');

  if (opts.dryRun) {
    return { dryRun: true, id, code, filled: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const marked = await s.evaluate(`(() => {
      const re = /c[oó]digo|code|pin|d[ií]gito|verifica/i;
      const inputs = [...document.querySelectorAll('input')]
        .filter((el) => el.offsetWidth || el.getClientRects().length);
      let el =
        inputs.find((i) =>
          re.test(
            [i.placeholder, i.getAttribute('aria-label'), i.name, i.id, i.type].join(' '),
          ),
        ) ||
        inputs.find((i) => i.type === 'tel' || i.inputMode === 'numeric') ||
        inputs.find((i) => i.type === 'text' || !i.type) ||
        null;
      if (!el) return null;
      document.querySelectorAll('[data-hcdp=pin]').forEach((e) => e.removeAttribute('data-hcdp'));
      el.setAttribute('data-hcdp', 'pin');
      return {
        id: el.id,
        name: el.name,
        type: el.type,
        aria: el.getAttribute('aria-label') || '',
        ph: el.placeholder || '',
      };
    })()`);
    if (!marked) throw new Error('campo PIN ausente');

    await s.click('[data-hcdp=pin]');
    await sleep(200);
    await s.fill('[data-hcdp=pin]', code);
    await sleep(1200);

    // LinkedIn às vezes auto-avança ao completar 6 dígitos.
    let cont = null;
    let autoAdvanced = false;
    for (let i = 0; i < 8; i++) {
      const st = await s.evaluate(`(() => {
        const href = location.href;
        const leftPin =
          !/email-confirmation|handle-confirmation|confirm.*email|challenge/i.test(href) &&
          !document.querySelector('[data-hcdp=pin]');
        const re = /^continuar$|^continue$|^confirmar$|^verify$|^enviar$|^submit$/i;
        document.querySelectorAll('[data-hcdp=pin-continue]').forEach((e) =>
          e.removeAttribute('data-hcdp'),
        );
        let label = null;
        for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
          if (!el.offsetWidth && !el.getClientRects().length) continue;
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
          const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
            .replace(/\\s+/g, ' ')
            .trim();
          if (re.test(t)) {
            el.setAttribute('data-hcdp', 'pin-continue');
            label = t.slice(0, 80);
            break;
          }
        }
        const pinEl = document.querySelector('[data-hcdp=pin]');
        return {
          href,
          leftPin,
          label,
          value: (pinEl?.value || '').replace(/\\D/g, ''),
          body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 180),
        };
      })()`);

      const href = String(st.href || '');
      const leftConfirm =
        /birthday|profile|location|experience|feed/i.test(href) ||
        (/onboarding\/start\//i.test(href) &&
          !/confirmation|confirm.*email|challenge/i.test(href));
      if (st.leftPin || leftConfirm) {
        autoAdvanced = true;
        cont = '(auto)';
        break;
      }
      if (st.label) {
        cont = st.label;
        await s.click('[data-hcdp=pin-continue]');
        await sleep(3000);
        break;
      }
      if (st.value && st.value !== code) {
        throw new Error(`PIN não ficou no campo (got=${st.value})`);
      }
      await sleep(500);
    }
    if (!cont) throw new Error('botão Continuar ausente após PIN');

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220),
    }))()`);

    return {
      id,
      code,
      filled: true,
      autoAdvanced,
      continue: cont,
      href: after.href,
      body: after.body,
    };
  } finally {
    s.close();
  }
}
