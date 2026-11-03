#!/usr/bin/env node
/**
 * Upload do banner (imagem de capa) LinkedIn (human-cdp) — pós-signup.
 *
 * Uso:
 *   node upload-profile-banner.mjs --id daniela-hoffmann --banner ../../../src/assets/banners/br-supply-01-caixas.jpg
 *   node upload-profile-banner.mjs --id daniela-hoffmann --banner /abs/capa.jpg --dry-run
 *
 * Fluxo PT-BR: /in/me → Adicionar/Editar imagem de fundo → Adicionar/Alterar imagem de capa
 *   → Carregar foto* → setFile → Salvar.
 * Cliques: human-cdp (trajetória). Upload: DOM.setFileInputFiles.
 */
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startCdp, getCdp, connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const PROFILE_URL = 'https://www.linkedin.com/in/me/';

function arg(...names) {
  for (const name of names) {
    const i = process.argv.indexOf(name);
    if (i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('-')) {
      return process.argv[i + 1].trim();
    }
  }
  return '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function log(...parts) {
  console.error(`[upload-banner] ${parts.join(' ')}`);
}

/**
 * @param {import('../human-cdp/src/session.mjs').HumanCdpSession} s
 * @param {RegExp} re
 * @param {string} mark
 * @param {{ maxH?: number }} [opts]
 */
async function clickText(s, re, mark = 'banner-btn', opts = {}) {
  const maxH = opts.maxH ?? 120;
  const hit = await s.evaluate(`(() => {
    const re = ${re.toString()};
    const maxH = ${maxH};
    document.querySelectorAll('[data-hcdp=${JSON.stringify(mark)}]').forEach((e) => {
      e.removeAttribute('data-hcdp');
    });
    const els = [...document.querySelectorAll('button,a,[role=button],label,[role=menuitem],div[role=button]')];
    const hits = [];
    for (const el of els) {
      if (!el.getClientRects().length) continue;
      const t = (el.innerText || el.getAttribute('aria-label') || el.value || '')
        .replace(/\\s+/g, ' ')
        .trim();
      if (!re.test(t)) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2 || b.height > maxH) continue;
      hits.push({ el, t, b, area: b.width * b.height, y: b.y });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => a.y - b.y || a.area - b.area);
    const best = hits[0];
    best.el.setAttribute('data-hcdp', ${JSON.stringify(mark)});
    return { text: best.t.slice(0, 80), x: best.b.x + best.b.width / 2, y: best.b.y + best.b.height / 2 };
  })()`);
  if (!hit) return null;
  log(`click «${hit.text}»`);
  await s.click(`[data-hcdp=${mark}]`);
  await sleep(900);
  return hit;
}

async function clickSkipIfAny(s) {
  return clickText(s, /^(pular|skip)$/i, 'banner-skip');
}

async function setLastFile(s, path) {
  await s.send('DOM.enable');
  const doc = await s.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await s.send('DOM.querySelectorAll', {
    nodeId: doc.root.nodeId,
    selector: 'input[type=file]',
  });
  if (!nodeIds?.length) throw new Error('sem input[type=file]');
  await s.send('DOM.setFileInputFiles', {
    files: [path],
    nodeId: nodeIds[nodeIds.length - 1],
  });
  log(`setFile ${path.split('/').pop()}`);
}

/**
 * @param {{
 *   id: string,
 *   banner: string,
 *   url?: string,
 *   dryRun?: boolean,
 * }} opts
 */
export async function uploadProfileBanner(opts = {}) {
  const id = String(opts.id || '').trim();
  const banner = resolve(String(opts.banner || opts.photo || '').trim());
  const url = String(opts.url || PROFILE_URL).trim();
  if (!id) throw new Error('uploadProfileBanner: id obrigatório');
  if (!banner) throw new Error('uploadProfileBanner: banner obrigatório');
  if (!existsSync(banner)) throw new Error(`banner inexistente: ${banner}`);

  if (opts.dryRun) {
    return { dryRun: true, id, banner, uploaded: false };
  }

  if (!getCdp(id)) throw new Error(`CDP não encontrado: ${id}`);

  log(`startCdp ${id}`);
  await startCdp(id);
  const s = await connectCdp(id, { debug: true });
  try {
    await s.send('Page.enable');
    await s.send('DOM.enable');
    await s.send('Page.setInterceptFileChooserDialog', { enabled: true });

    log(`goto ${url}`);
    await s.goto(url);
    await sleep(4000);
    await clickSkipIfAny(s);
    await s.evaluate(`([...document.querySelectorAll('[aria-label="Fechar"],[aria-label="Fechar sugestão"]')]
      .forEach((e) => { try { e.click(); } catch {} }))`);
    await sleep(400);

    const cam = await s.evaluate(`(() => {
      document.querySelectorAll('[data-hcdp=banner-cam]').forEach((e) => e.removeAttribute('data-hcdp'));
      const el =
        document.querySelector('[aria-label="Adicionar imagem de fundo"]') ||
        document.querySelector('[aria-label="Editar imagem de fundo"]') ||
        document.querySelector('[aria-label="Add background image"]') ||
        document.querySelector('[aria-label="Edit background image"]') ||
        document.querySelector('[aria-label="Foto de capa"]');
      if (!el) return null;
      el.setAttribute('data-hcdp', 'banner-cam');
      const r = el.getBoundingClientRect();
      return {
        aria: el.getAttribute('aria-label') || '',
        x: r.x + r.width / 2,
        y: r.y + r.height / 2,
      };
    })()`);
    if (!cam) throw new Error('sem controle de imagem de fundo/capa');

    log(`open capa «${cam.aria}»`);
    await s.click('[data-hcdp=banner-cam]');
    await sleep(2200);
    await clickSkipIfAny(s);

    // Menu: Adicionar/Alterar/Editar imagem de capa
    let menu =
      (await clickText(
        s,
        /^(adicionar|alterar|editar) imagem de capa$|^(add|change|edit) (background|cover)/i,
        'banner-menu',
        { maxH: 80 },
      )) || null;
    if (!menu) {
      // fallback: clickAt no 1º candidato topish
      const item = await s.evaluate(`(() => {
        const labels = [
          'Adicionar imagem de capa',
          'Alterar imagem de capa',
          'Editar imagem de capa',
          'Add cover image',
          'Change cover image',
          'Edit cover image',
        ];
        document.querySelectorAll('[data-hcdp=banner-menu]').forEach((e) => e.removeAttribute('data-hcdp'));
        const nodes = [...document.querySelectorAll('a,button,[role=menuitem],div[role=button]')];
        const cands = nodes
          .map((e) => {
            const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
            if (!labels.some((l) => t === l || t.startsWith(l))) return null;
            const r = e.getBoundingClientRect();
            if (r.width < 2 || r.height < 2 || r.height > 80) return null;
            return { el: e, t, x: r.x + r.width / 2, y: r.y + r.height / 2, topish: r.y < 320 };
          })
          .filter(Boolean);
        cands.sort((a, b) => Number(b.topish) - Number(a.topish) || a.y - b.y);
        if (!cands.length) return null;
        cands[0].el.setAttribute('data-hcdp', 'banner-menu');
        return { text: cands[0].t.slice(0, 80), x: cands[0].x, y: cands[0].y };
      })()`);
      if (item) {
        log(`click «${item.text}»`);
        await s.click('[data-hcdp=banner-menu]');
        menu = item;
        await sleep(2000);
      }
    } else {
      await sleep(2000);
    }

    // Capa existente: Alterar foto / Editar → depois Carregar*
    for (const re of [/^alterar foto$/i, /^editar$/i, /^change photo$/i, /^edit$/i]) {
      if (await clickText(s, re, 'banner-edit', { maxH: 80 })) {
        await sleep(1200);
        break;
      }
    }

    const upload =
      (await clickText(s, /^carregar foto única$/i, 'banner-upload')) ||
      (await clickText(s, /^selecionar imagem$/i, 'banner-upload')) ||
      (await clickText(s, /^carregar foto$/i, 'banner-upload')) ||
      (await clickText(s, /^carregar$|^upload( photo)?$/i, 'banner-upload'));
    if (!upload) throw new Error('botão Carregar foto ausente');

    await sleep(800);
    await setLastFile(s, banner);
    await sleep(3000);

    if (
      !(await clickText(s, /^salvar alterações$|^save changes$/i, 'banner-save')) &&
      !(await clickText(s, /^salvar$|^save$/i, 'banner-save'))
    ) {
      throw new Error('botão Salvar ausente');
    }
    await sleep(8000);
    await clickSkipIfAny(s);

    await s.goto(url);
    await sleep(4000);
    await clickSkipIfAny(s);

    const st = await s.evaluate(`(() => {
      const aria =
        document.querySelector('[aria-label="Editar imagem de fundo"],[aria-label="Adicionar imagem de fundo"],[aria-label="Foto de capa"],[aria-label="Edit background image"],[aria-label="Add background image"]')
          ?.getAttribute('aria-label') || '';
      const bg = [...document.querySelectorAll('img')].find((i) => {
        const src = i.currentSrc || i.src || '';
        const r = i.getBoundingClientRect();
        return r.width > 200 && /profile-displaybackground|background|banner|cover/i.test(src);
      });
      return {
        href: location.href,
        aria,
        bg: (bg?.currentSrc || '').slice(0, 160),
      };
    })()`);

    const hasBg =
      !!st.bg || /editar imagem de fundo|edit background|foto de capa/i.test(st.aria);
    if (!hasBg && /adicionar imagem de fundo|add background/i.test(st.aria)) {
      throw new Error('banner não detectado após upload');
    }

    log(`OK ${st.bg || st.aria}`);
    return {
      id,
      banner,
      uploaded: true,
      href: st.href,
      bannerSrc: st.bg || null,
      aria: st.aria,
    };
  } finally {
    s.close();
  }
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.error(
      `uso: node upload-profile-banner.mjs --id <cdp-id> --banner <caminho.jpg>
  flags: --dry-run
  default url: ${PROFILE_URL}`,
    );
    process.exit(0);
  }

  const id = arg('--id', '--cdp');
  const bannerArg = arg('--banner', '--capa', '--photo', '--foto');
  if (!id || !bannerArg) {
    console.error('uso: node upload-profile-banner.mjs --id <cdp-id> --banner <caminho.jpg>');
    process.exit(1);
  }

  const banner = resolve(process.cwd(), bannerArg);
  const result = await uploadProfileBanner({
    id,
    banner,
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
