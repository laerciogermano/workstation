#!/usr/bin/env node
/** Prefer Pular; se birthday, marca Sim e Continuar. */
import { connectCdp } from './human-cdp/src/index.mjs';
import { sleep } from './human-cdp/src/human.mjs';

const s = await connectCdp('bruno-nunes', {
  urlIncludes: 'linkedin.com',
});

async function snap() {
  return s.evaluate(`(() => ({
    href: location.href,
    body: (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 400),
    btns: [...document.querySelectorAll('button,a,[role=button],label')]
      .filter((el) => el.offsetWidth || el.getClientRects().length)
      .map((el) =>
        (el.innerText || el.getAttribute('aria-label') || '')
          .replace(/\\s+/g, ' ')
          .trim()
          .slice(0, 60),
      )
      .filter(Boolean)
      .slice(0, 25),
  }))()`);
}

async function clickRe(reSrc) {
  const hit = await s.evaluate(`(() => {
    const re = new RegExp(${JSON.stringify(reSrc)}, 'i');
    document.querySelectorAll('[data-hcdp=hit]').forEach((e) => e.removeAttribute('data-hcdp'));
    for (const el of document.querySelectorAll('button,a,[role=button],label,div[role=button]')) {
      if (!el.offsetWidth && !el.getClientRects().length) continue;
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
  await sleep(1800);
  return true;
}

let st = await snap();
console.log('now', st.href.slice(0, 120));
console.log(st.body);
console.log(st.btns);

for (let i = 0; i < 20; i++) {
  st = await snap();
  console.log('STEP', i, st.href.slice(0, 100), '|', st.body.slice(0, 140));

  if (/\/feed\/?/i.test(st.href) && !/onboarding/i.test(st.href)) {
    console.log('OK FEED');
    break;
  }

  if (await clickRe('^pular$|^skip$|agora n[aã]o|not now')) continue;

  if (/maior de 18|birthday/i.test(st.body + st.href)) {
    await clickRe('sim,? sou maior|yes,? i.?m over|^sim$');
    await clickRe('continuar|continue');
    continue;
  }

  if (await clickRe('continuar|continue|avan[cç]ar|concluir|done')) continue;

  console.log('stuck');
  break;
}

st = await snap();
console.log('FINAL', st.href);
console.log(st.body.slice(0, 250));
s.close();
if (!/\/feed\/?/i.test(st.href) || /onboarding/i.test(st.href)) process.exitCode = 2;
else console.log('OK');
