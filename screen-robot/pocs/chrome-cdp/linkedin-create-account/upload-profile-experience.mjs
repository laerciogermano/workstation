#!/usr/bin/env node
/**
 * Adiciona experiência(s) LinkedIn (human-cdp) — pós-signup.
 *
 * Uso:
 *   node upload-profile-experience.mjs --id daniela-hoffmann --file ./experience-daniela-hoffmann.json
 *   node upload-profile-experience.mjs --id x --title "Cargo" --company "Empresa" --current
 *
 * Fluxo PT-BR: /in/me → SPA /edit/forms/position → cargo+empresa (+datas/desc) → Salvar.
 * Page.navigate no form NÃO hidrata — clicar o <a>.
 */
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startCdp, getCdp, connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const PROFILE_URL = 'https://www.linkedin.com/in/me/';
const DESC_MAX = 2000;

function arg(...names) {
  for (const name of names) {
    const i = process.argv.indexOf(name);
    if (i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('-')) {
      return process.argv[i + 1];
    }
  }
  return '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function log(...parts) {
  console.error(`[upload-exp] ${parts.join(' ')}`);
}

/**
 * @param {import('../human-cdp/src/session.mjs').HumanCdpSession} s
 * @param {RegExp} re
 * @param {string} mark
 * @param {{ preferLower?: boolean, maxH?: number }} [opts]
 */
async function clickText(s, re, mark = 'exp-btn', opts = {}) {
  const preferLower = !!opts.preferLower;
  const maxH = opts.maxH ?? 200;
  const hit = await s.evaluate(`(() => {
    const re = ${re.toString()};
    const preferLower = ${preferLower ? 'true' : 'false'};
    const maxH = ${maxH};
    document.querySelectorAll('[data-hcdp=${JSON.stringify(mark)}]').forEach((e) => {
      e.removeAttribute('data-hcdp');
    });
    const hits = [];
    for (const el of document.querySelectorAll('button,a,[role=button],[role=menuitem],div[role=button]')) {
      if (!el.getClientRects().length) continue;
      const t = (el.innerText || el.getAttribute('aria-label') || el.value || '')
        .replace(/\\s+/g, ' ')
        .trim();
      if (!re.test(t)) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2 || b.height > maxH) continue;
      hits.push({ el, t, y: b.y });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => (preferLower ? b.y - a.y : a.y - b.y));
    hits[0].el.setAttribute('data-hcdp', ${JSON.stringify(mark)});
    return { text: hits[0].t.slice(0, 80), y: hits[0].y };
  })()`);
  if (!hit) return null;
  log(`click «${hit.text}»`);
  await s.click(`[data-hcdp=${mark}]`);
  await sleep(900);
  return hit;
}

async function clickSkipIfAny(s) {
  return clickText(s, /^(pular|skip)$/i, 'exp-skip');
}

async function clickPositionAnchor(s) {
  const hit = await s.evaluate(`(() => {
    document.querySelectorAll('[data-hcdp=exp-anchor]').forEach((e) => e.removeAttribute('data-hcdp'));
    const el = [...document.querySelectorAll('a[href]')].find((e) => {
      if (!e.getClientRects().length) return false;
      return /\\/edit\\/forms\\/position/i.test(e.getAttribute('href') || '');
    });
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    el.setAttribute('data-hcdp', 'exp-anchor');
    return {
      text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
      href: el.getAttribute('href') || '',
    };
  })()`);
  if (!hit) return null;
  log(`spa-click «${hit.text || hit.href}»`);
  await s.click('[data-hcdp=exp-anchor]');
  await sleep(1500);
  return hit;
}

async function waitPositionForm(s, tries = 25) {
  for (let i = 0; i < tries; i++) {
    const st = await s.evaluate(`(() => {
      const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
      const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),input[role=combobox]')]
        .filter((e) => e.getClientRects().length)
        .filter((e) => !/^pesquisar$|^search$/i.test((e.placeholder || e.getAttribute('aria-label') || '').trim()))
        .map((e) => ((e.getAttribute('aria-label') || '') + ' ' + (e.placeholder || '') + ' ' + (e.name || '')).trim());
      const hasJob = inputs.some((a) =>
        /cargo|title|job|fun[cç][aã]o|gerente de produtos|exemplo:\\s*gerente/i.test(a),
      ) || /cargo\\*/i.test(body);
      return { hydrated: hasJob && inputs.length >= 1, n: inputs.length, sample: inputs.slice(0, 8) };
    })()`);
    if (st.hydrated) return st;
    await sleep(800);
  }
  return null;
}

async function typeahead(s, text, hintRe, mark) {
  const typed = String(text).split(',')[0].trim();
  const box = await s.evaluate(`(() => {
    const re = ${hintRe.toString()};
    document.querySelectorAll('[data-hcdp=${JSON.stringify(mark)}]').forEach((e) => e.removeAttribute('data-hcdp'));
    const inputs = [...document.querySelectorAll('input[type=text],input:not([type]),input[role=combobox]')]
      .filter((e) => e.getClientRects().length)
      .filter((e) => !/^pesquisar$|^search$/i.test((e.placeholder || e.getAttribute('aria-label') || '').trim()));
    const el = inputs.find((e) =>
      re.test(
        (e.getAttribute('aria-label') || '') +
          ' ' +
          (e.placeholder || '') +
          ' ' +
          (e.name || '') +
          ' ' +
          (e.id || ''),
      ),
    );
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    el.setAttribute('data-hcdp', ${JSON.stringify(mark)});
    return {
      aria: el.getAttribute('aria-label') || el.placeholder || '',
    };
  })()`);
  if (!box) throw new Error(`typeahead input ausente: ${hintRe}`);
  log(`typeahead «${box.aria}» ← ${typed}`);
  await s.click(`[data-hcdp=${mark}]`);
  await sleep(200);
  await s.fill(`[data-hcdp=${mark}]`, typed);
  await sleep(2800);

  const optMark = `${mark}-opt`;
  // Sempre a 1ª sugestão do typeahead (nunca 2ª+ por match de texto).
  const pick = await s.evaluate(`(() => {
    document.querySelectorAll('[data-hcdp=${JSON.stringify(optMark)}]').forEach((e) => e.removeAttribute('data-hcdp'));
    const opts = [...document.querySelectorAll('[role=option],.basic-typeahead__selectable')]
      .filter((el) => el.getClientRects().length)
      .map((el) => ({
        el,
        text: (el.innerText || '').replace(/\\s+/g, ' ').trim(),
        y: el.getBoundingClientRect().y,
      }))
      .filter((o) => o.text);
    opts.sort((a, b) => a.y - b.y);
    const chosen = opts[0];
    if (!chosen) return { sample: [] };
    chosen.el.setAttribute('data-hcdp', ${JSON.stringify(optMark)});
    return { text: chosen.text.slice(0, 120), sample: opts.slice(0, 5).map((o) => o.text) };
  })()`);
  log(`opts ${JSON.stringify(pick.sample || [])}`);
  if (pick.text) {
    log(`pick 1ª «${pick.text}»`);
    await s.click(`[data-hcdp=${optMark}]`);
    await sleep(700);
  } else {
    // typeahead LI às vezes só via setas
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
    await sleep(300);
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
    await sleep(700);
  }
}

/** Marca checkbox "trabalho aqui atualmente" (clica o label — input costuma ter 0×0). */
async function setCurrentRole(s, wantCurrent) {
  const st = await s.evaluate(`(() => {
    const boxes = [...document.querySelectorAll('input[type=checkbox]')];
    const box = boxes.find((e) =>
      /trabalho aqui atualmente|currently work|cargo atual|i currently work/i.test(
        (e.getAttribute('aria-label') || '') + ' ' + (e.closest('label')?.innerText || ''),
      ),
    );
    if (!box) return { found: false };
    document.querySelectorAll('[data-hcdp=exp-current]').forEach((e) => e.removeAttribute('data-hcdp'));
    const label = box.closest('label') || box.parentElement;
    const target = label && label.getClientRects().length ? label : box;
    target.setAttribute('data-hcdp', 'exp-current');
    const b = target.getBoundingClientRect();
    return {
      found: true,
      checked: !!box.checked,
      x: b.x + b.width / 2,
      y: b.y + b.height / 2,
      w: b.width,
      h: b.height,
    };
  })()`);
  if (!st.found) {
    log('currentRole checkbox ausente');
    return false;
  }
  if (st.checked !== wantCurrent) {
    if (st.w >= 2 && st.h >= 2) {
      await s.click('[data-hcdp=exp-current]');
    } else {
      await s.clickAt(st.x, st.y);
    }
    await sleep(700);
  }
  log(`currentRole ${wantCurrent}`);
  return true;
}

/** Seleciona mês/ano em <select> ou combobox próximo ao label. */
async function setDatePart(s, which, value) {
  if (!value) return false;
  const needle = String(value).toLowerCase();
  const mark = `exp-date-${which}`;
  const hit = await s.evaluate(`(() => {
    const which = ${JSON.stringify(which)};
    const needle = ${JSON.stringify(needle)};
    document.querySelectorAll('[data-hcdp=${JSON.stringify(mark)}]').forEach((e) => e.removeAttribute('data-hcdp'));

    const labelRe = {
      startMonth: /m[eê]s\\s*de\\s*in[ií]cio|m[eê]s\\s*inicial|start\\s*month/i,
      startYear: /ano\\s*de\\s*in[ií]cio|ano\\s*inicial|start\\s*year/i,
      endMonth: /m[eê]s\\s*de\\s*t[eé]rmino|m[eê]s\\s*final|end\\s*month/i,
      endYear: /ano\\s*de\\s*t[eé]rmino|ano\\s*final|end\\s*year/i,
    }[which];
    if (!labelRe) return null;

    // selects
    const selects = [...document.querySelectorAll('select')].filter((e) => e.getClientRects().length);
    for (const sel of selects) {
      const lab =
        (sel.getAttribute('aria-label') || '') +
        ' ' +
        (sel.id ? document.querySelector(\`label[for="\${sel.id}"]\`)?.innerText || '' : '') +
        ' ' +
        (sel.closest('div')?.querySelector('label')?.innerText || '') +
        ' ' +
        (sel.closest('label')?.innerText || '') +
        ' ' +
        (sel.previousElementSibling?.innerText || '');
      if (!labelRe.test(lab)) continue;
      const opts = [...sel.options].map((o, i) => ({
        i,
        v: o.value,
        t: (o.textContent || '').replace(/\\s+/g, ' ').trim(),
      }));
      const match =
        opts.find((o) => o.v === needle || o.t.toLowerCase() === needle) ||
        opts.find((o) => o.t.toLowerCase().startsWith(needle)) ||
        opts.find((o) => o.t.toLowerCase().includes(needle));
      if (!match) continue;
      sel.setAttribute('data-hcdp', ${JSON.stringify(mark)});
      return { kind: 'select', text: match.t, value: match.v, index: match.i, lab: lab.slice(0, 60) };
    }

    // combobox / button triggers
    const triggers = [...document.querySelectorAll('button, [role=combobox], select')]
      .filter((e) => e.getClientRects().length);
    for (const el of triggers) {
      const lab = (el.getAttribute('aria-label') || el.innerText || '').replace(/\\s+/g, ' ').trim();
      if (!labelRe.test(lab)) continue;
      el.setAttribute('data-hcdp', ${JSON.stringify(mark)});
      return { kind: 'combo', lab: lab.slice(0, 60) };
    }
    return null;
  })()`);

  if (!hit) {
    log(`date ${which}=${value} miss`);
    return false;
  }

  if (hit.kind === 'select') {
    await s.evaluate(`(() => {
      const sel = document.querySelector('[data-hcdp=${JSON.stringify(mark)}]');
      if (!sel) return false;
      sel.selectedIndex = ${Number(hit.index)};
      sel.value = ${JSON.stringify(hit.value)};
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    log(`date ${which}=«${hit.text}»`);
    await sleep(300);
    return true;
  }

  await s.click(`[data-hcdp=${mark}]`);
  await sleep(800);
  const dateOptMark = `${mark}-opt`;
  const opt = await s.evaluate(`(() => {
    const needle = ${JSON.stringify(needle)};
    document.querySelectorAll('[data-hcdp=${JSON.stringify(dateOptMark)}]').forEach((e) => e.removeAttribute('data-hcdp'));
    const opts = [...document.querySelectorAll('[role=option], li, button')]
      .filter((e) => e.getClientRects().length)
      .map((e) => ({
        el: e,
        t: (e.innerText || '').replace(/\\s+/g, ' ').trim(),
      }))
      .filter((o) => o.t && o.t.length < 40);
    const chosen =
      opts.find((o) => o.t.toLowerCase() === needle) ||
      opts.find((o) => o.t.toLowerCase().startsWith(needle)) ||
      opts.find((o) => o.t.toLowerCase().includes(needle));
    if (!chosen) return { sample: opts.slice(0, 8).map((o) => o.t) };
    chosen.el.setAttribute('data-hcdp', ${JSON.stringify(dateOptMark)});
    return { text: chosen.t };
  })()`);
  if (!opt.text) {
    log(`date ${which} combo opts ${JSON.stringify(opt.sample || [])}`);
    return false;
  }
  await s.click(`[data-hcdp=${dateOptMark}]`);
  log(`date ${which}=«${opt.text}»`);
  await sleep(400);
  return true;
}

async function fillDescription(s, text) {
  const desc = String(text || '').trim().slice(0, DESC_MAX);
  if (!desc) return false;
  const ed = await s.evaluate(`(() => {
    document.querySelectorAll('[data-hcdp=exp-desc]').forEach((e) => e.removeAttribute('data-hcdp'));
    const areas = [...document.querySelectorAll(
      'textarea,[contenteditable=true],div[role=textbox]',
    )].filter((e) => e.getClientRects().length);
    const pick =
      areas.find((e) =>
        /descri|description|resumo|summary|sobre o cargo|highlights|destaques/i.test(
          (e.getAttribute('aria-label') || '') + ' ' + (e.placeholder || '') + ' ' + (e.id || ''),
        ),
      ) ||
      areas.find((e) => e.getBoundingClientRect().height > 60) ||
      null;
    if (!pick) return null;
    pick.scrollIntoView({ block: 'center' });
    pick.setAttribute('data-hcdp', 'exp-desc');
    return { tag: pick.tagName, aria: pick.getAttribute('aria-label') || pick.placeholder || '' };
  })()`);
  if (!ed) {
    log('description field ausente');
    return false;
  }
  await s.click('[data-hcdp=exp-desc]');
  await sleep(250);
  await s.evaluate(`(() => {
    const el = document.querySelector('[data-hcdp=exp-desc]');
    if (!el) return;
    el.focus();
    if (el.tagName === 'TEXTAREA') {
      el.select();
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  })()`);
  await s.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8,
  });
  await s.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8,
  });
  await s.send('Input.insertText', { text: desc });
  log(`description ${desc.length} chars`);
  await sleep(400);
  return true;
}

async function openPositionForm(s) {
  if (await clickPositionAnchor(s)) return true;
  if (
    await clickText(
      s,
      /^(adicionar cargo|add position|add experience|adicionar experi[eê]ncia)$/i,
      'exp-add',
      { preferLower: true },
    )
  ) {
    await sleep(1200);
    if (await clickPositionAnchor(s)) return true;
    if ((await waitPositionForm(s, 8))?.hydrated) return true;
  }
  if (
    await clickText(
      s,
      /adicionar experi[eê]ncia|add (an )?experience/i,
      'exp-add2',
      { preferLower: true },
    )
  ) {
    await sleep(1500);
    if (await clickPositionAnchor(s)) return true;
    if ((await waitPositionForm(s, 8))?.hydrated) return true;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (
      !(await clickText(s, /^adicionar se[cç][aã]o$|^add (profile )?section$/i, 'exp-section', {
        preferLower: true,
      }))
    ) {
      break;
    }
    await sleep(2000 + attempt * 400);
    if (await clickPositionAnchor(s)) return true;
  }
  return false;
}

async function dismissModals(s) {
  await s.evaluate(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"],[aria-label="Dismiss"]')]
    .forEach((e) => { try { e.click(); } catch {} }))`);
  await sleep(300);
}

/**
 * @param {{
 *   id: string,
 *   experiences: Array<{
 *     title: string,
 *     company: string,
 *     current?: boolean,
 *     startMonth?: string,
 *     startYear?: string,
 *     endMonth?: string,
 *     endYear?: string,
 *     description?: string,
 *   }>,
 *   url?: string,
 *   force?: boolean,
 *   dryRun?: boolean,
 * }} opts
 */
export async function uploadProfileExperience(opts = {}) {
  const id = String(opts.id || '').trim();
  const experiences = Array.isArray(opts.experiences) ? opts.experiences : [];
  const url = String(opts.url || PROFILE_URL).trim();
  const force = !!opts.force;
  if (!id) throw new Error('uploadProfileExperience: id obrigatório');
  if (!experiences.length) throw new Error('uploadProfileExperience: experiences vazio');

  if (opts.dryRun) {
    return { dryRun: true, id, count: experiences.length, uploaded: false };
  }
  if (!getCdp(id)) throw new Error(`CDP não encontrado: ${id}`);

  log(`startCdp ${id} n=${experiences.length}`);
  await startCdp(id);
  const s = await connectCdp(id);
  const results = [];

  try {
    await s.send('Page.enable');

    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];
      const title = String(exp.title || exp.job || '').trim();
      const company = String(exp.company || exp.empresa || '').trim();
      if (!title || !company) throw new Error(`experiência[${i}]: title/company obrigatórios`);

      log(`--- [${i + 1}/${experiences.length}] ${title} @ ${company}`);
      await s.goto(url);
      await sleep(4000);
      await clickSkipIfAny(s);
      await dismissModals(s);

      const before = await s.evaluate(`(() => {
        const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
        return {
          href: location.href,
          hasTitle: body.includes(${JSON.stringify(title)}),
          hasCo: new RegExp(${JSON.stringify(company)}, 'i').test(body),
        };
      })()`);
      if (/\/login|checkpoint/i.test(before.href)) {
        throw new Error(`não autenticado: ${before.href}`);
      }
      if (before.hasTitle && before.hasCo && !force) {
        log('já no perfil — skip');
        results.push({ title, company, skipped: true });
        continue;
      }

      if (!(await openPositionForm(s))) {
        throw new Error('âncora /edit/forms/position ausente');
      }
      const form = await waitPositionForm(s, 25);
      if (!form?.hydrated) throw new Error('form experiência não hidratou');
      log(`form n=${form.n}`);

      await typeahead(
        s,
        title,
        /cargo|title|job|fun[cç][aã]o|gerente de produtos|exemplo:\s*gerente/i,
        'exp-title',
      );
      await sleep(400);
      await typeahead(
        s,
        company,
        /empresa|company|empregador|employer|organiza|exemplo:\s*microsoft/i,
        'exp-company',
      );
      await sleep(400);

      await setCurrentRole(s, !!exp.current);
      await sleep(800);
      await setDatePart(s, 'startMonth', exp.startMonth || 'jan');
      await setDatePart(s, 'startYear', exp.startYear);
      if (!exp.current) {
        await sleep(500);
        await setDatePart(s, 'endMonth', exp.endMonth || 'dez');
        await setDatePart(s, 'endYear', exp.endYear);
      }
      await fillDescription(s, exp.description);

      if (
        !(await clickText(s, /^(salvar|save)$/i, 'exp-save')) &&
        !(await clickText(s, /^salvar alterações$|^save changes$/i, 'exp-save'))
      ) {
        throw new Error('botão Salvar ausente');
      }
      await sleep(5000);
      await clickSkipIfAny(s);

      await s.goto(url);
      await sleep(4000);
      const check = await s.evaluate(`(() => {
        const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
        return {
          href: location.href,
          hasTitle: body.includes(${JSON.stringify(title)}),
          hasCo: new RegExp(${JSON.stringify(company)}, 'i').test(body),
        };
      })()`);
      if (!check.hasTitle) {
        throw new Error(`cargo não apareceu no perfil: ${title}`);
      }
      log(`OK ${title}`);
      results.push({ title, company, uploaded: true, href: check.href });
    }

    return { id, uploaded: true, results };
  } finally {
    s.close();
  }
}

const DETAILS_EXP_URL = 'https://www.linkedin.com/in/me/details/experience/';

/**
 * Edita experiências existentes (lápis em /details/experience/).
 * Use matchTitle para achar o card quando o cargo for renomeado.
 *
 * @param {{
 *   id: string,
 *   experiences: Array<Record<string, any>>,
 *   dryRun?: boolean,
 * }} opts
 */
export async function editProfileExperiences(opts = {}) {
  const id = String(opts.id || '').trim();
  const experiences = Array.isArray(opts.experiences) ? opts.experiences : [];
  if (!id) throw new Error('editProfileExperiences: id obrigatório');
  if (!experiences.length) throw new Error('editProfileExperiences: experiences vazio');
  if (opts.dryRun) {
    return { dryRun: true, id, count: experiences.length, edited: false };
  }
  if (!getCdp(id)) throw new Error(`CDP não encontrado: ${id}`);

  log(`startCdp ${id} edit n=${experiences.length}`);
  await startCdp(id);
  const s = await connectCdp(id);
  const results = [];

  try {
    await s.send('Page.enable');

    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];
      const title = String(exp.title || '').trim();
      const company = String(exp.company || '').trim();
      const matchTitle = String(exp.matchTitle || title).trim();
      if (!title || !company) throw new Error(`experiência[${i}]: title/company obrigatórios`);

      log(`--- edit [${i + 1}/${experiences.length}] ${matchTitle} → ${title} @ ${company}`);
      await s.goto(DETAILS_EXP_URL);
      await sleep(4500);
      await clickSkipIfAny(s);
      await dismissModals(s);

      const opened = await s.evaluate(`(() => {
        const matchTitle = ${JSON.stringify(matchTitle)};
        const company = ${JSON.stringify(company)};
        document.querySelectorAll('[data-hcdp=exp-edit]').forEach((e) => e.removeAttribute('data-hcdp'));
        const links = [...document.querySelectorAll('a[href*="experience/edit/forms"], a[href*="edit/forms/position"]')];
        const el = links.find((a) => {
          const aria = (a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ');
          const text = (a.innerText || '').replace(/\\s+/g, ' ');
          const blob = (aria + ' ' + text).toLowerCase();
          return blob.includes(matchTitle.toLowerCase()) && new RegExp(company, 'i').test(blob);
        }) || links.find((a) => {
          const aria = (a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ');
          return /editar/i.test(aria) && aria.toLowerCase().includes(matchTitle.toLowerCase());
        });
        if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        el.setAttribute('data-hcdp', 'exp-edit');
        return {
          aria: (el.getAttribute('aria-label') || '').slice(0, 120),
          href: el.getAttribute('href') || '',
        };
      })()`);
      if (!opened) throw new Error(`lápis de edição não encontrado: ${matchTitle} @ ${company}`);
      log(`spa-click «${opened.aria || opened.href}»`);
      await s.click('[data-hcdp=exp-edit]');
      await sleep(2000);

      const form = await waitPositionForm(s, 25);
      if (!form?.hydrated) throw new Error('form de edição não hidratou');

      await typeahead(
        s,
        title,
        /cargo|title|job|fun[cç][aã]o|gerente de produtos|exemplo:\s*gerente/i,
        'exp-title',
      );
      await sleep(400);
      // empresa já associada — não mexe no typeahead (evita trocar entidade)

      await setCurrentRole(s, !!exp.current);
      await sleep(800);
      await setDatePart(s, 'startMonth', exp.startMonth || 'jan');
      await setDatePart(s, 'startYear', exp.startYear);
      if (!exp.current) {
        await sleep(500);
        await setDatePart(s, 'endMonth', exp.endMonth || 'dez');
        await setDatePart(s, 'endYear', exp.endYear);
      }
      await fillDescription(s, exp.description);

      if (
        !(await clickText(s, /^(salvar|save)$/i, 'exp-save')) &&
        !(await clickText(s, /^salvar alterações$|^save changes$/i, 'exp-save'))
      ) {
        throw new Error('botão Salvar ausente');
      }
      await sleep(5000);
      await clickSkipIfAny(s);
      log(`OK edit ${title}`);
      results.push({ title, company, edited: true });
    }

    await s.goto(PROFILE_URL);
    await sleep(3500);
    return { id, edited: true, results };
  } finally {
    s.close();
  }
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.error(
      `uso: node upload-profile-experience.mjs --id <cdp> --file experiences.json
       node upload-profile-experience.mjs --id <cdp> --file experiences.json --edit
       node upload-profile-experience.mjs --id <cdp> --title "Cargo" --company "Empresa" [--current]
  flags: --edit · --force · --dry-run`,
    );
    process.exit(0);
  }

  const id = arg('--id', '--cdp');
  const file = arg('--file', '--experiences');
  let experiences = [];
  if (file) {
    const p = resolve(process.cwd(), file);
    if (!existsSync(p)) {
      console.error('arquivo inexistente:', p);
      process.exit(1);
    }
    experiences = JSON.parse(readFileSync(p, 'utf8'));
  } else {
    const title = arg('--title', '--job', '--cargo');
    const company = arg('--company', '--empresa');
    if (title && company) {
      experiences = [
        {
          title,
          company,
          current: hasFlag('--current'),
          startMonth: arg('--start-month') || 'jan',
          startYear: arg('--start-year'),
          endMonth: arg('--end-month') || 'dez',
          endYear: arg('--end-year'),
          description: arg('--description', '--desc'),
        },
      ];
    }
  }

  if (!id || !experiences.length) {
    console.error('uso: --id + --file JSON | --title + --company');
    process.exit(1);
  }

  const result = hasFlag('--edit')
    ? await editProfileExperiences({
        id,
        experiences,
        dryRun: hasFlag('--dry-run'),
      })
    : await uploadProfileExperience({
        id,
        experiences,
        force: hasFlag('--force'),
        dryRun: hasFlag('--dry-run'),
      });
  console.log(JSON.stringify(result, null, 2));
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error('Falha:', e.message || e);
    process.exit(1);
  });
}
