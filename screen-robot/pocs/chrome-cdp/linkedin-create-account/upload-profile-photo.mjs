#!/usr/bin/env node
/**
 * Upload da foto de perfil LinkedIn (human-cdp) — pós-signup.
 *
 * Uso:
 *   node upload-profile-photo.mjs --id daniela-hoffmann --photo ../../tasks/…/v06-daniela-hoffmann.jpg
 *   node upload-profile-photo.mjs --id daniela-hoffmann --photo /abs/foto.jpg --dry-run
 *
 * Fluxo PT-BR: /in/me → Foto do perfil → Editar/Atualizar/Carregar → setFile → Salvar.
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
  console.error(`[upload-photo] ${parts.join(' ')}`);
}

/**
 * Marca e clica o 1º elemento cujo texto/aria casa com `re`.
 * @param {import('../human-cdp/src/session.mjs').HumanCdpSession} s
 * @param {RegExp} re
 * @param {string} mark
 */
async function clickText(s, re, mark = 'photo-btn') {
  const hit = await s.evaluate(`(() => {
    const re = ${re.toString()};
    document.querySelectorAll('[data-hcdp=${JSON.stringify(mark)}]').forEach((e) => {
      e.removeAttribute('data-hcdp');
    });
    const els = [...document.querySelectorAll('button,a,[role=button],label,[role=menuitem]')];
    for (const el of els) {
      if (!el.getClientRects().length) continue;
      const t = (el.innerText || el.getAttribute('aria-label') || el.value || '')
        .replace(/\\s+/g, ' ')
        .trim();
      if (!re.test(t)) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      el.setAttribute('data-hcdp', ${JSON.stringify(mark)});
      return { text: t.slice(0, 80), x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }
    return null;
  })()`);
  if (!hit) return null;
  log(`click «${hit.text}»`);
  await s.click(`[data-hcdp=${mark}]`);
  await sleep(900);
  return hit;
}

async function clickSkipIfAny(s) {
  return clickText(s, /^(pular|skip)$/i, 'photo-skip');
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
 *   photo: string,
 *   url?: string,
 *   dryRun?: boolean,
 * }} opts
 */
export async function uploadProfilePhoto(opts = {}) {
  const id = String(opts.id || '').trim();
  const photo = resolve(String(opts.photo || '').trim());
  const url = String(opts.url || PROFILE_URL).trim();
  if (!id) throw new Error('uploadProfilePhoto: id obrigatório');
  if (!photo) throw new Error('uploadProfilePhoto: photo obrigatório');
  if (!existsSync(photo)) throw new Error(`foto inexistente: ${photo}`);

  if (opts.dryRun) {
    return { dryRun: true, id, photo, uploaded: false };
  }

  if (!getCdp(id)) throw new Error(`CDP não encontrado: ${id}`);

  log(`startCdp ${id}`);
  await startCdp(id);
  const s = await connectCdp(id);
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

    const corner = await s.evaluate(`(() => {
      document.querySelectorAll('[data-hcdp=photo-corner]').forEach((e) => e.removeAttribute('data-hcdp'));
      const el =
        document.querySelector('[aria-label="Foto do perfil"]') ||
        document.querySelector('[aria-label="Adicionar foto"]') ||
        document.querySelector('[aria-label="Profile photo"]') ||
        document.querySelector('[aria-label="Add photo"]');
      if (!el) return null;
      el.setAttribute('data-hcdp', 'photo-corner');
      const r = el.getBoundingClientRect();
      return {
        aria: el.getAttribute('aria-label') || '',
        x: r.x + Math.max(r.width - 8, r.width / 2),
        y: r.y + Math.max(r.height - 8, r.height / 2),
      };
    })()`);
    if (!corner) throw new Error('sem controle de foto do perfil');

    log(`open photo «${corner.aria}»`);
    // canto do botão (lápis) — clickAt com trajetória
    await s.clickAt(corner.x, corner.y);
    await sleep(1200);
    await clickSkipIfAny(s);

    const isAdd = /adicionar|add photo/i.test(corner.aria);
    if (!isAdd) {
      // já tem foto: menu → Atualizar (NÃO Editar — Editar só abre crop)
      if (!(await clickText(s, /^atualizar$|^update$/i, 'photo-update'))) {
        throw new Error('botão Atualizar ausente');
      }
      await sleep(1500);
    }
    if (!(await clickText(s, /^carregar foto$|^upload photo$/i, 'photo-upload'))) {
      throw new Error('botão Carregar foto ausente');
    }

    await sleep(800);
    await setLastFile(s, photo);
    await sleep(3000);

    if (
      !(await clickText(s, /^salvar alterações$|^save changes$/i, 'photo-save')) &&
      !(await clickText(s, /^salvar$|^save$/i, 'photo-save'))
    ) {
      throw new Error('botão Salvar ausente');
    }
    await sleep(8000);
    await clickSkipIfAny(s);

    // recarrega /in/me — o modal às vezes ainda cobre a foto
    await s.goto(url);
    await sleep(4000);
    await clickSkipIfAny(s);

    const st = await s.evaluate(`(() => ({
      href: location.href,
      aria: document.querySelector('[aria-label="Foto do perfil"],[aria-label="Profile photo"],[aria-label="Adicionar foto"],[aria-label="Add photo"]')?.getAttribute('aria-label') || '',
      photo: ([...document.querySelectorAll('img')].find((i) =>
        i.getBoundingClientRect().width > 80 &&
        /profile-displayphoto/i.test(i.currentSrc || i.src || ''),
      )?.currentSrc || '').slice(0, 160),
    }))()`);

    if (!st.photo && !/foto do perfil|profile photo/i.test(st.aria)) {
      throw new Error('foto de perfil não detectada após upload');
    }

    log(`OK ${st.photo || st.aria}`);
    return { id, photo, uploaded: true, href: st.href, photoSrc: st.photo || null, aria: st.aria };
  } finally {
    s.close();
  }
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.error(
      `uso: node upload-profile-photo.mjs --id <cdp-id> --photo <caminho.jpg>
  flags: --dry-run
  default url: ${PROFILE_URL}`,
    );
    process.exit(0);
  }

  const id = arg('--id', '--cdp');
  const photoArg = arg('--photo', '--foto', '--avatar');
  if (!id || !photoArg) {
    console.error('uso: node upload-profile-photo.mjs --id <cdp-id> --photo <caminho.jpg>');
    process.exit(1);
  }

  const photo = resolve(process.cwd(), photoArg);
  const result = await uploadProfilePhoto({
    id,
    photo,
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
