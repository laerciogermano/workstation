#!/usr/bin/env node
/**
 * Cadastro Facebook Rafaela — só human-cdp (CDP ometv-1 :9232).
 * DOB fictícia 15/03/2008 (18 anos em 2026-11-02).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from '../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';
import { sleep } from '../screen-robot/pocs/chrome-cdp/human-cdp/src/human.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const FB_PASS = readFileSync('/tmp/rafaela-fb-pass.txt', 'utf8').trim();
const EMAIL = 'rafaela.nogueira@clozzy.com.br';

const s = await connect({
  cdpUrl: 'http://127.0.0.1:9232',
  urlIncludes: 'facebook.com/reg',
});
await s.bringToFront();
await s.goto('https://www.facebook.com/reg/');
await sleep(2000);

async function remarca() {
  return s.evaluate(`(() => {
    const mark = (el, v) => { if (el) el.setAttribute('data-hcdp', v); };
    for (const el of document.querySelectorAll('input')) {
      if (!el.offsetWidth) continue;
      const t = (el.parentElement?.innerText || '').trim().split('\\n')[0];
      if (t === 'Nome' && el.type === 'text') mark(el, 'first');
      if (t === 'Sobrenome') mark(el, 'last');
      if (/celular ou email/i.test(t)) mark(el, 'email');
      if (el.type === 'password') mark(el, 'pass');
    }
    const enviar = [...document.querySelectorAll('[role=button],div,button')]
      .find((el) => (el.innerText || '').trim() === 'Enviar' && el.offsetWidth);
    mark(enviar, 'submit');
    const gender = [...document.querySelectorAll('[role=combobox]')]
      .find((el) => /Selecione seu|gênero|genero/i.test(el.innerText || ''));
    mark(gender, 'gender');
    return {
      first: !!document.querySelector('[data-hcdp=first]'),
      last: !!document.querySelector('[data-hcdp=last]'),
      email: !!document.querySelector('[data-hcdp=email]'),
      pass: !!document.querySelector('[data-hcdp=pass]'),
      gender: !!document.querySelector('[data-hcdp=gender]'),
      submit: !!document.querySelector('[data-hcdp=submit]'),
    };
  })()`);
}

async function pickOption(matchers) {
  await sleep(500);
  const ok = await s.evaluate(`(() => {
    const matchers = ${JSON.stringify(matchers)};
    const opts = [...document.querySelectorAll('[role=option]')]
      .filter((el) => el.offsetWidth && el.offsetHeight);
    for (const m of matchers) {
      const reExact = new RegExp('^' + m + '$', 'i');
      let hit = opts.find((el) => reExact.test((el.innerText || '').trim()));
      if (!hit) {
        const re = new RegExp(m, 'i');
        hit = opts.find((el) => re.test((el.innerText || '').trim()));
      }
      if (hit) {
        hit.setAttribute('data-hcdp', 'opt');
        return hit.innerText.trim();
      }
    }
    return null;
  })()`);
  if (!ok) {
    const dump = await s.evaluate(
      `(() => [...document.querySelectorAll('[role=option]')].slice(0, 25).map((e) => e.innerText.trim()))()`,
    );
    throw new Error('option not found ' + JSON.stringify(matchers) + ' ' + JSON.stringify(dump));
  }
  await s.click('[data-hcdp=opt]');
  await sleep(400);
  return ok;
}

const marks = await remarca();
console.log('marks', marks);

await s.fill('[data-hcdp=first]', 'Rafaela');
await s.fill('[data-hcdp=last]', 'Nogueira');

await s.click('[aria-label="Selecionar o dia"]');
console.log('day', await pickOption(['15']));

await s.click('[aria-label="Selecionar o mês"]');
console.log('month', await pickOption(['março', 'marco', 'mar', 'Mar']));

await s.click('[aria-label="Selecionar o ano"]');
console.log('year', await pickOption(['2008']));

await remarca();
await s.click('[data-hcdp=gender]');
console.log('gender', await pickOption(['Feminino', 'Mulher', 'Female']));

await remarca();
await s.fill('[data-hcdp=email]', EMAIL);
await s.fill('[data-hcdp=pass]', FB_PASS);

await remarca();
await s.click('[data-hcdp=submit]');
await sleep(4000);

const after = await s.evaluate(`(() => ({
  href: location.href,
  title: document.title,
  body: document.body.innerText.slice(0, 1500),
}))()`);
console.log(JSON.stringify(after, null, 2));

writeFileSync(
  join(__dir, 'facebook-signup-last.json'),
  JSON.stringify({ email: EMAIL, dob: '2008-03-15', after, at: new Date().toISOString() }, null, 2) +
    '\n',
);

s.close();
