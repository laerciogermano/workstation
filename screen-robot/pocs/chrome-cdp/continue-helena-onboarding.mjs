#!/usr/bin/env node
/** Continua onboarding LI Helena a partir da tela atual (human-cdp). */
import { connectCdp } from './human-cdp/src/index.mjs';
import { sleep } from './human-cdp/src/human.mjs';

const LOCATION = 'Salvador, Brasil';
const JOB = 'Especialista em suprimentos e itens corporativos';
const COMPANY = 'ConectMax';

const s = await connectCdp('helena-duarte', {
  urlIncludes: 'linkedin.com',
  debug: true,
});

async function snap() {
  return s.evaluate(`(() => ({
    href: location.href,
    body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 500),
    inputs: [...document.querySelectorAll('input,textarea')]
      .filter((el) => el.offsetWidth)
      .map((el) => ({
        type: el.type,
        id: el.id,
        name: el.name,
        ph: el.placeholder || '',
        aria: el.getAttribute('aria-label') || '',
        val: (el.value || '').slice(0, 80),
      })),
    btns: [...document.querySelectorAll('button,a,[role=button]')]
      .filter((el) => el.offsetWidth)
      .map((el) =>
        (el.innerText || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim(),
      )
      .filter(Boolean)
      .slice(0, 30),
  }))()`);
}

async function clickText(reSrc) {
  const hit = await s.evaluate(`(() => {
    const re = new RegExp(${JSON.stringify(reSrc)}, 'i');
    for (const el of document.querySelectorAll('button,a,[role=button],div[role=button]')) {
      if (!el.offsetWidth) continue;
      const t = (el.innerText || el.getAttribute('aria-label') || '')
        .replace(/\\s+/g, ' ')
        .trim();
      if (re.test(t)) {
        el.setAttribute('data-hcdp', 'hit');
        return t.slice(0, 80);
      }
    }
    return null;
  })()`);
  if (!hit) return false;
  console.log('click', hit);
  await s.click('[data-hcdp=hit]');
  await sleep(2200);
  return true;
}

async function fillByHint(text, hintSrc) {
  const meta = await s.evaluate(`(() => {
    const re = new RegExp(${JSON.stringify(hintSrc)}, 'i');
    const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),textarea')]
      .filter((el) => el.offsetWidth);
    let el =
      inputs.find((i) =>
        re.test(
          [i.placeholder, i.getAttribute('aria-label'), i.name, i.id].join(' '),
        ),
      ) || inputs[0];
    if (!el) return null;
    document.querySelectorAll('[data-hcdp=field]').forEach((e) => e.removeAttribute('data-hcdp'));
    el.setAttribute('data-hcdp', 'field');
    return {
      ph: el.placeholder,
      aria: el.getAttribute('aria-label'),
      val: el.value,
    };
  })()`);
  if (!meta) throw new Error('no input for ' + hintSrc);
  console.log('fill', meta, '←', text);
  await s.click('[data-hcdp=field]');
  await sleep(200);
  await s.fill('[data-hcdp=field]', text);
  await sleep(2000);
  const opt = await s.evaluate(`(() => {
    const t0 = ${JSON.stringify(text.split(',')[0].trim().toLowerCase())};
    const opts = [...document.querySelectorAll('[role=option]')].filter((el) => el.offsetWidth);
    if (!opts.length) return null;
    const chosen =
      opts.find((o) => (o.innerText || '').toLowerCase().includes(t0)) || opts[0];
    document.querySelectorAll('[data-hcdp=opt]').forEach((e) => e.removeAttribute('data-hcdp'));
    chosen.setAttribute('data-hcdp', 'opt');
    return (chosen.innerText || '').trim().slice(0, 100);
  })()`);
  if (opt) {
    console.log('pick', opt);
    await s.click('[data-hcdp=opt]');
    await sleep(900);
  }
}

for (let i = 0; i < 22; i++) {
  const st = await snap();
  console.log('STEP', i, st.href.slice(0, 120));
  console.log(' body', st.body.slice(0, 200));
  console.log(' btns', st.btns.slice(0, 12));
  console.log(' inputs', st.inputs);

  if (/\/feed\/?/i.test(st.href) && !/onboarding/i.test(st.href)) {
    console.log('OK FEED');
    break;
  }

  if (await clickText('^pular$|^skip$')) continue;

  if (/profile-location|localidade|location/i.test(st.href + st.body)) {
    await fillByHint(LOCATION, 'local|cidade|ex\\.:|são paulo|location|vaga');
    await clickText('continuar|continue|avan[cç]ar');
    continue;
  }

  if (
    /profile-edit|experi[eê]ncia|cargo|empresa|job-title|work-experience/i.test(
      st.href + st.body,
    )
  ) {
    if (st.inputs.some((inp) => /cargo|t[ií]tulo|job|title|função/i.test(inp.ph + inp.aria))) {
      await fillByHint(JOB, 'cargo|t[ií]tulo|job|title|função');
    } else if (st.inputs[0]) {
      await fillByHint(JOB, '.');
    }
    const st2 = await snap();
    if (
      st2.inputs.some((inp) =>
        /empresa|company|empregador|organiza/i.test(inp.ph + inp.aria),
      )
    ) {
      await fillByHint(COMPANY, 'empresa|company|empregador|organiza');
    }
    if (!(await clickText('continuar|continue|avan[cç]ar|concluir|done|salvar'))) {
      await clickText('^pular$|^skip$');
    }
    continue;
  }

  if (/maior de 18|birthday|tem mais de 18/i.test(st.body)) {
    await s.evaluate(`(() => {
      const r = document.querySelector('input[type=radio]');
      if (r) {
        document.querySelectorAll('[data-hcdp=yes]').forEach((e) => e.removeAttribute('data-hcdp'));
        r.setAttribute('data-hcdp', 'yes');
      }
      return !!r;
    })()`);
    try {
      await s.click('[data-hcdp=yes]');
    } catch {
      /* */
    }
    await clickText('continuar|continue');
    continue;
  }

  if (/get-the-app|aplicativo|baixe o app/i.test(st.href + st.body)) {
    await clickText('continuar|continue|agora n[aã]o|not now|^pular$|^skip$');
    continue;
  }

  if (await clickText('continuar|continue|avan[cç]ar|concluir|done')) continue;

  console.log('stuck');
  break;
}

const final = await snap();
console.log('FINAL', final.href);
console.log(final.body.slice(0, 400));
s.close();
if (!/\/feed\/?/i.test(final.href) || /onboarding/i.test(final.href)) {
  process.exitCode = 2;
}
