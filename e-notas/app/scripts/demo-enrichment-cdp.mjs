/**
 * Demo visual das 3 capacidades de enrichment via Chrome CDP (human-cdp).
 * Uso: CDP_URL=http://127.0.0.1:9223 node scripts/demo-enrichment-cdp.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from '../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/demo-enrichment');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9223';
const APP = process.env.APP_URL || 'https://127.0.0.1:4173/';

fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const buf = await page.screenshot();
  const file = path.join(OUT, `${name}.png`);
  fs.writeFileSync(file, buf);
  console.log('shot', file);
  return file;
}

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

const page = await connect({
  cdpUrl: CDP,
  url: APP,
});

await wait(1200);
await shot(page, '01-home-produtos');

// --- 1) Descrição → EAN ---
await page.evaluate(`document.querySelector('.tab[data-tab="empresas"]')?.click()`);
await wait(900);
await shot(page, '02-estabelecimentos');

const openedLoja = await page.evaluate(`(() => {
  const cards = [...document.querySelectorAll('[data-open-loja]')];
  const condor = cards.find((c) => /CONDOR/i.test(c.textContent || ''));
  const btn = condor || cards[0];
  if (!btn) return null;
  btn.click();
  return (btn.textContent || '').trim().slice(0, 60);
})()`);
console.log('loja', openedLoja);
await wait(1100);
await shot(page, '03-vitrine-loja');

const openedEan = await page.evaluate(`(() => {
  const btns = [...document.querySelectorAll('[data-vincular-ean]')];
  const sem = btns.find((b) => {
    const ean = (b.dataset.ean || '').trim();
    const nome = (b.dataset.nome || '').trim();
    return !ean && nome.length > 5;
  });
  const btn = sem || btns[0];
  if (!btn) return null;
  btn.click();
  return {
    nome: btn.dataset.nome,
    codigo: btn.dataset.codigo,
    ean: btn.dataset.ean || '',
  };
})()`);
console.log('item modal', openedEan);
await wait(1600);
await shot(page, '04-modal-ean');

await page.click('#btn-ean-sugerir');
await wait(5500);
await shot(page, '05-sugerir-ean-candidatos');

const suggestInfo = await page.evaluate(`(() => {
  const status = document.getElementById('ean-suggest-status')?.textContent || '';
  const items = [...document.querySelectorAll('#ean-suggest-list .ean-suggest-btn')].map((b) => ({
    ean: b.dataset.ean,
    text: (b.textContent || '').replace(/\\s+/g, ' ').trim(),
  }));
  return { status, items };
})()`);
console.log('sugestoes', JSON.stringify(suggestInfo, null, 2));

if (suggestInfo?.items?.[0]) {
  await page.click('#ean-suggest-list .ean-suggest-btn');
  await wait(700);
  await shot(page, '06-ean-preenchido');
}

await page.evaluate(`document.querySelector('[data-close-ean]')?.click()`);
await wait(500);

// --- 2) EAN → imagens ---
await page.evaluate(`document.querySelector('.tab[data-tab="produtos"]')?.click()`);
await wait(900);

const openedProduto = await page.evaluate(`(() => {
  const cards = [...document.querySelectorAll('[data-open-produto]')];
  const withFoto = cards.find((c) => c.querySelector('img'));
  const btn = withFoto || cards[0];
  if (!btn) return null;
  btn.click();
  return (btn.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
})()`);
console.log('produto', openedProduto);
await wait(1300);
await shot(page, '07-produto-detalhe');

await page.evaluate(
  `document.getElementById('produto-fotos')?.scrollIntoView({ block: 'center' })`,
);
await wait(500);
await shot(page, '08-produto-fotos-ean');

try {
  await page.click('#produto-fotos-buscar');
} catch (err) {
  console.warn('buscar fotos click:', err.message);
  await page.evaluate(`document.getElementById('produto-fotos-buscar')?.click()`);
}
await wait(6500);
await shot(page, '09-imagens-por-ean');

// --- 3) Descrição → imagens ---
const descResult = await page.evaluate(
  `(() => {
  const descricao = 'LEITE INTEGRAL 1L';
  return fetch('api/enrichment/imagens-por-descricao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('demo-enrich-panel')?.remove();
      const panel = document.createElement('div');
      panel.id = 'demo-enrich-panel';
      panel.style.cssText =
        'position:fixed;inset:auto 12px 12px 12px;z-index:99999;background:#fff;border:2px solid #111;border-radius:12px;padding:14px;max-height:55vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);font:14px/1.4 system-ui';
      const fromEan = (data.imagens || [])
        .map((i) => i.path_local || i.url_origem)
        .filter(Boolean)
        .slice(0, 4);
      const fromTexto = (data.imagens_texto || []).map((i) => i.url).slice(0, 4);
      const imgs = fromEan.concat(fromTexto);
      panel.innerHTML =
        '<strong>Descrição → imagens</strong>' +
        '<div style="margin:.4rem 0;color:#444">“' +
        descricao +
        '” · modo <code>' +
        data.modo +
        '</code> · ean ' +
        (data.ean || '—') +
        ' · score ' +
        (data.score ?? '—') +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        imgs
          .map(
            (u) =>
              '<img src="' +
              u +
              '" alt="" style="width:88px;height:88px;object-fit:contain;border:1px solid #ddd;border-radius:8px;background:#fafafa"/>',
          )
          .join('') +
        '</div>' +
        '<div style="margin-top:.5rem;font-size:12px;color:#666">' +
        (data.candidatos || [])
          .slice(0, 3)
          .map((c) => c.ean + ' (' + Math.round(c.score * 100) + '% ' + c.fonte + ')')
          .join(' · ') +
        '</div>';
      document.body.appendChild(panel);
      return {
        ok: data.ok,
        modo: data.modo,
        ean: data.ean,
        score: data.score,
        nImgs: imgs.length,
        candidatos: (data.candidatos || []).slice(0, 3),
      };
    });
})()`,
  { awaitPromise: true },
);
console.log('desc-imgs', JSON.stringify(descResult, null, 2));
await wait(1400);
await shot(page, '10-imagens-por-descricao');

console.log('DONE', OUT);
page.close();
process.exit(0);
