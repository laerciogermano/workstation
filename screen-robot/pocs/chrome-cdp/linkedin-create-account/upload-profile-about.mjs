#!/usr/bin/env node
/**
 * Preenche a seção Sobre (About / summary) LinkedIn (human-cdp) — pós-signup.
 *
 * Uso:
 *   node upload-profile-about.mjs --id daniela-hoffmann --about "Texto..."
 *   node upload-profile-about.mjs --id daniela-hoffmann --about-file ./about.txt
 *
 * Fluxo PT-BR (Help LI + SPA):
 *   /in/me → ancora /edit/forms/summary (ou Adicionar seção → Sobre)
 *   → contenteditable ≤2600 → Salvar.
 * Importante: clicar o <a> SPA — Page.navigate no form NÃO hidrata o editor.
 * Cliques: human-cdp. Texto: Input.insertText.
 */
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startCdp, getCdp, connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const PROFILE_URL = 'https://www.linkedin.com/in/me/';
const ABOUT_MAX = 2600;

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
  console.error(`[upload-about] ${parts.join(' ')}`);
}

/**
 * @param {import('../human-cdp/src/session.mjs').HumanCdpSession} s
 * @param {RegExp} re
 * @param {string} mark
 * @param {{ preferLower?: boolean }} [opts]
 */
async function clickText(s, re, mark = 'about-btn', opts = {}) {
  const preferLower = !!opts.preferLower;
  const hit = await s.evaluate(`(() => {
    const re = ${re.toString()};
    const preferLower = ${preferLower ? 'true' : 'false'};
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
      if (b.width < 2 || b.height < 2) continue;
      hits.push({ el, t, b, y: b.y });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => (preferLower ? b.y - a.y : a.y - b.y));
    const best = hits[0];
    best.el.setAttribute('data-hcdp', ${JSON.stringify(mark)});
    return { text: best.t.slice(0, 80), y: best.y };
  })()`);
  if (!hit) return null;
  log(`click «${hit.text}»`);
  await s.click(`[data-hcdp=${mark}]`);
  await sleep(900);
  return hit;
}

async function clickSkipIfAny(s) {
  return clickText(s, /^(pular|skip)$/i, 'about-skip');
}

/** Clique SPA no ancora summary — marca + human click (hidrata form). */
async function clickSummaryAnchor(s) {
  const hit = await s.evaluate(`(() => {
    document.querySelectorAll('[data-hcdp=about-anchor]').forEach((e) => e.removeAttribute('data-hcdp'));
    const el = [...document.querySelectorAll('a[href]')].find((e) => {
      if (!e.getClientRects().length) return false;
      return /\\/edit\\/forms\\/summary/i.test(e.getAttribute('href') || '');
    });
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    el.setAttribute('data-hcdp', 'about-anchor');
    const b = el.getBoundingClientRect();
    return {
      text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
      href: el.getAttribute('href') || '',
      x: b.x + b.width / 2,
      y: b.y + b.height / 2,
    };
  })()`);
  if (!hit) return null;
  log(`spa-click «${hit.text || hit.href}»`);
  await s.click('[data-hcdp=about-anchor]');
  await sleep(1500);
  return hit;
}

async function findAboutEditor(s) {
  return s.evaluate(`(() => {
    document.querySelectorAll('[data-hcdp=about-editor]').forEach((e) => e.removeAttribute('data-hcdp'));
    const areas = [...document.querySelectorAll(
      'textarea,[contenteditable=true],div[role=textbox],[contenteditable=""]',
    )].filter((e) => e.getClientRects().length);
    const pick =
      areas.find((e) =>
        /sobre|about|summary|resumo/i.test(
          (e.getAttribute('aria-label') || '') + ' ' + (e.id || '') + ' ' + (e.className || ''),
        ),
      ) ||
      areas.find((e) => {
        const b = e.getBoundingClientRect();
        return b.height > 50 && b.width > 180;
      }) ||
      areas[0];
    if (!pick) return null;
    pick.setAttribute('data-hcdp', 'about-editor');
    const b = pick.getBoundingClientRect();
    return {
      tag: pick.tagName,
      aria: pick.getAttribute('aria-label') || '',
      x: b.x + b.width / 2,
      y: b.y + Math.min(40, b.height / 2),
    };
  })()`);
}

async function waitEditor(s, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const ed = await findAboutEditor(s);
    if (ed) return ed;
    await sleep(800);
  }
  return null;
}

/**
 * @param {{
 *   id: string,
 *   about: string,
 *   url?: string,
 *   dryRun?: boolean,
 * }} opts
 */
export async function uploadProfileAbout(opts = {}) {
  const id = String(opts.id || '').trim();
  const about = String(opts.about || '')
    .trim()
    .slice(0, ABOUT_MAX);
  const url = String(opts.url || PROFILE_URL).trim();
  if (!id) throw new Error('uploadProfileAbout: id obrigatório');
  if (!about) throw new Error('uploadProfileAbout: about obrigatório');

  if (opts.dryRun) {
    return { dryRun: true, id, aboutLen: about.length, uploaded: false };
  }

  if (!getCdp(id)) throw new Error(`CDP não encontrado: ${id}`);

  log(`startCdp ${id} aboutLen=${about.length}`);
  await startCdp(id);
  const s = await connectCdp(id);
  try {
    await s.send('Page.enable');

    log(`goto ${url}`);
    await s.goto(url);
    await sleep(4500);
    await clickSkipIfAny(s);
    await s.evaluate(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"]')]
      .forEach((e) => { try { e.click(); } catch {} }))`);
    await sleep(400);

    let opened = !!(await clickSummaryAnchor(s));
    if (!opened) {
      if (
        await clickText(
          s,
          /^adicionar se[cç][aã]o$|^add (profile )?section$/i,
          'about-add-section',
          { preferLower: true },
        )
      ) {
        await sleep(1800);
        opened = !!(await clickSummaryAnchor(s));
        if (!opened) {
          opened = !!(await clickText(
            s,
            /adicionar se[cç][aã]o sobre|add about/i,
            'about-add-about',
          ));
        }
      }
    }
    if (!opened) throw new Error('âncora /edit/forms/summary ausente');

    const editor = await waitEditor(s, 20);
    if (!editor) throw new Error('editor Sobre não hidratou após clique SPA');
    log(`editor ${editor.tag} «${editor.aria}»`);

    await s.click('[data-hcdp=about-editor]');
    await sleep(300);
    await s.evaluate(`(() => {
      const el = document.querySelector('[data-hcdp=about-editor]') ||
        document.querySelector('[contenteditable=true],textarea,div[role=textbox]');
      if (!el) return false;
      el.focus();
      if (el.tagName === 'TEXTAREA') {
        el.select();
        return true;
      }
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    })()`);
    await sleep(100);
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
    await s.send('Input.insertText', { text: about });
    log(`pasted ${about.length} chars`);
    await sleep(600);

    if (
      !(await clickText(s, /^(salvar|save)$/i, 'about-save')) &&
      !(await clickText(s, /^salvar alterações$|^save changes$/i, 'about-save'))
    ) {
      throw new Error('botão Salvar ausente');
    }
    await sleep(4500);
    await clickSkipIfAny(s);

    await s.goto(url);
    await sleep(4000);
    await clickSkipIfAny(s);

    const snippet = about.slice(0, 40);
    const check = await s.evaluate(`(() => {
      const body = (document.body?.innerText || '').replace(/\\s+/g, ' ');
      const snippet = ${JSON.stringify(snippet)};
      return {
        href: location.href,
        hasSnippet: body.includes(snippet),
        aboutHead: (body.match(/Sobre[\\s\\S]{0,220}/) || [''])[0].slice(0, 200),
      };
    })()`);

    if (!check.hasSnippet) {
      throw new Error('texto Sobre não apareceu no perfil');
    }

    log(`OK ${check.aboutHead.slice(0, 80)}`);
    return {
      id,
      aboutLen: about.length,
      uploaded: true,
      href: check.href,
      aboutHead: check.aboutHead,
    };
  } finally {
    s.close();
  }
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.error(
      `uso: node upload-profile-about.mjs --id <cdp-id> --about "Texto..."
       node upload-profile-about.mjs --id <cdp-id> --about-file caminho.txt
  flags: --dry-run
  limite: ${ABOUT_MAX} chars`,
    );
    process.exit(0);
  }

  const id = arg('--id', '--cdp');
  let about = arg('--about', '--sobre', '--text', '--texto');
  const aboutFile = arg('--about-file', '--file');
  if (aboutFile) {
    const p = resolve(process.cwd(), aboutFile);
    if (!existsSync(p)) {
      console.error('arquivo inexistente:', p);
      process.exit(1);
    }
    about = readFileSync(p, 'utf8');
  }
  if (!id || !String(about || '').trim()) {
    console.error(
      'uso: node upload-profile-about.mjs --id <cdp-id> --about "Texto..." | --about-file path',
    );
    process.exit(1);
  }

  const result = await uploadProfileAbout({
    id,
    about,
    dryRun: hasFlag('--dry-run'),
  });
  console.log(JSON.stringify(result));
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error('Falha:', e.message || e);
    process.exit(1);
  });
}
