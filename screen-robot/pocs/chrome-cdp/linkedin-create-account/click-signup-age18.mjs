/**
 * Onboarding LinkedIn: "Sim, sou maior de 18" → Continuar.
 * UI birthday-collection: radio com 0×0 + label vazio — clica por coordenadas.
 */
import { connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

/**
 * @param {{ id: string, dryRun?: boolean }} opts
 */
export async function clickSignupAge18(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('clickSignupAge18: id obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, clicked: false };
  }

  const s = await connectCdp(id, { debug: true });
  try {
    const target = await s.evaluate(`(() => {
      const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
      const isBirthday =
        /birthday|tem mais de 18|maior de 18|over 18|older than 18/i.test(
          location.href + ' ' + body,
        );
      if (!isBirthday) return null;

      const radios = [...document.querySelectorAll('input[type=radio]')];
      if (!radios.length) return null;
      const radio = radios[0];
      const label =
        (radio.id && document.querySelector('label[for="' + CSS.escape(radio.id) + '"]')) ||
        radio.closest('label') ||
        radio.parentElement;
      const el = label || radio;
      const r = el.getBoundingClientRect();
      // se o alvo for 0×0, usar posição do radio + offset típico do círculo
      const x = Math.round(
        (r.width > 0 ? r.x + r.width / 2 : radio.getBoundingClientRect().x + 12),
      );
      const y = Math.round(
        (r.height > 0 ? r.y + r.height / 2 : radio.getBoundingClientRect().y + 10),
      );
      return {
        x,
        y,
        t: 'radio[0] birthday/maior-de-18',
        via: 'coords',
        checked: !!radio.checked,
      };
    })()`);
    if (!target) throw new Error('opção "maior de 18" ausente');

    await s.clickAt(target.x, target.y);
    await sleep(800);

    const cont = await s.evaluate(`(() => {
      const re = /^continuar$|^continue$|^next$/i;
      for (const el of document.querySelectorAll('button, [role=button], input[type=submit]')) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
        const t = (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (re.test(t)) {
          return {
            t: t.slice(0, 80),
            x: Math.round(r.x + r.width / 2),
            y: Math.round(r.y + r.height / 2),
          };
        }
      }
      return null;
    })()`);
    if (!cont) throw new Error('botão Continuar ausente/desabilitado após idade 18');

    await s.clickAt(cont.x, cont.y);
    await sleep(3000);

    const after = await s.evaluate(`(() => ({
      href: location.href,
      body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220),
    }))()`);

    return {
      id,
      clicked: target.t,
      via: target.via,
      continue: cont.t,
      href: after.href,
      body: after.body,
    };
  } finally {
    s.close();
  }
}
