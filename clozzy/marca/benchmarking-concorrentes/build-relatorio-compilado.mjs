/**
 * Gera relatorio-compilado.html (matriz + todas as prints desktop/mobile).
 * Uso: node build-relatorio-compilado.mjs
 * PDF (local, ~200MB+): Chrome headless — ver README.
 */
import { readdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const platforms = [
  {
    id: 'privacy',
    name: 'Privacy',
    rank: '#3 · #1 BR',
    url: 'https://privacy.com.br/',
    when: '2026-11-09',
    tax: '20%',
    pix: 'Sim',
    note: 'Referência BR · Pix · audiência',
  },
  {
    id: 'closefans',
    name: 'CloseFans',
    rank: '#10 · #2 BR',
    url: 'https://close.fans/',
    when: '2026-11-10',
    tax: '20% + fixo',
    pix: 'Sim',
    note: 'Site + Telegram CloseBot · packs',
  },
  {
    id: 'fatalfans',
    name: 'FatalFans',
    rank: '#11 · #3 BR',
    url: 'https://fatalfans.com/',
    when: '2026-11-10',
    tax: '15%',
    pix: 'Sim',
    note: 'Fatal Model · Creator Awards',
  },
  {
    id: 'fansly',
    name: 'Fansly',
    rank: '#4 global',
    url: 'https://fansly.com/',
    when: '2026-11-10',
    tax: '~20%',
    pix: 'Não (UI lab)',
    note: 'Explore / For You / lives · ban IA fotorealista',
  },
];

const features = [
  ['Cadastro fan (e-mail/senha)', 'Sim', 'Sim', 'Sim', 'Sim'],
  ['OAuth', 'Google, X, Apple, TikTok', 'OAuth genérico', 'Google, X', 'X, Google, Twitch'],
  ['Confirmação de e-mail', 'Obrigatória', 'Não (lab)', 'Não (lab)', 'Obrigatória (UI)'],
  ['Age gate 18+', 'Sim', 'Termos', 'Sim', 'Sim'],
  ['Discovery / Explore', 'Destaques · Top · Em alta', 'Descobrir + filtros + packs', 'Filtros · Awards · rankings', 'Explore · For You · hashtags'],
  ['Live streams', 'Sim', 'Lives (help)', '—', 'Streams You Might Like'],
  ['Chat / DM', 'Sim', 'Sim (+ mimo)', 'Sim', 'Messages'],
  ['Videochamada 1:1', 'Sim', 'Sim (Top Videochamadas)', 'Sim (pago)', '—'],
  ['Assinatura', 'Sim', 'Sim', 'Sim + cupom', 'Sim'],
  ['Pack / conteúdo avulso', 'Post avulso', 'Top Packs · chat', 'Avulso / DM', 'Collections / bookmarks'],
  ['Carteira / tips', 'Carteira · mimo', 'Presente · carteira', 'Presente', 'Wallet · crypto · gift'],
  ['Telegram / bot', '—', 'CloseBot nativo', 'Prévias Telegram', '—'],
  ['Pix', 'Sim', 'Sim', 'Sim', 'Não óbvio'],
  ['Cartão', 'Sim + Apple/Google Pay', 'Sim', 'Sim', 'Visa/MC/Discover'],
  ['Taxa plataforma', '~20%', '20% + fixo', '15%', '~20%'],
  ['App nativo', 'Não (PWA)', 'Não (Web App)', 'Não', 'Não'],
  ['2FA', '—', '—', '—', 'Sim'],
  ['Creator KYC', 'Certta docs+selfie', 'Docs e-mail', 'Docs + biometria', 'Gov ID (help)'],
  ['IA fotorealista', 'Policy help (perfil IA)', 'Ban explícito', 'Ban só menoridade', 'Ban (label não libera)'],
  ['IA chat/auto fãs', 'Sem suite', 'Ban', 'Sem suite', 'Ban sem oversight'],
];

function listPngs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function captionFromName(file) {
  return file
    .replace(/\.png$/i, '')
    .replace(/^\d+[a-z]?-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gallery(platformId, files, kind) {
  if (!files.length) return `<p class="muted">Sem prints ${kind}.</p>`;
  return (
    `<div class="gallery">` +
    files
      .map((f) => {
        const src = `${platformId}/prints/${kind}/${f}`;
        return `<figure class="shot">
  <img src="${esc(src)}" alt="${esc(captionFromName(f))}" loading="lazy" />
  <figcaption><span>${esc(captionFromName(f))}</span><code>${esc(f)}</code></figcaption>
</figure>`;
      })
      .join('\n') +
    `</div>`
  );
}

const data = platforms.map((p) => ({
  ...p,
  desktop: listPngs(join(ROOT, p.id, 'prints', 'desktop')),
  mobile: listPngs(join(ROOT, p.id, 'prints', 'mobile')),
}));
const totalShots = data.reduce((n, p) => n + p.desktop.length + p.mobile.length, 0);
const today = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clozzy 2028 — Relatório de benchmarking (compilado)</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper: #ffffff;
    --surface: #f6f7f9;
    --ink: #161616;
    --body: #525252;
    --muted: #6f6f6f;
    --line: #e0e0e0;
    --line-strong: #c6c6c6;
    --accent: #0f62fe;
    --accent-soft: #edf5ff;
    --radius: 2px;
    --font: "IBM Plex Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    --mono: "IBM Plex Mono", ui-monospace, monospace;
    --max: 1080px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font);
    font-size: 15px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: var(--max); margin: 0 auto; padding: 48px 32px 80px; }
  header.cover {
    border-bottom: 1px solid var(--line-strong);
    padding-bottom: 28px;
    margin-bottom: 36px;
  }
  .kicker {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  h1 {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.15;
    margin-bottom: 12px;
  }
  .deck { color: var(--body); max-width: 42rem; font-size: 16px; }
  .meta-row {
    display: flex; flex-wrap: wrap; gap: 8px 20px;
    margin-top: 18px; font-size: 13px; color: var(--muted);
  }
  .meta-row strong { color: var(--ink); font-weight: 600; }
  h2 {
    font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
    margin: 48px 0 14px; padding-top: 20px; border-top: 1px solid var(--line);
  }
  h3 { font-size: 16px; font-weight: 600; margin: 28px 0 10px; }
  h4 {
    font-size: 13px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.04em; color: var(--muted); margin: 22px 0 10px;
  }
  p { margin: 0 0 12px; color: var(--body); }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .toc {
    background: var(--surface); border: 1px solid var(--line);
    padding: 18px 20px; margin: 24px 0 8px;
  }
  .toc ol { margin: 0 0 0 18px; color: var(--ink); }
  .toc li { margin: 4px 0; }
  .toc a { color: var(--ink); }
  .toc a:hover { color: var(--accent); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0 8px; }
  th, td {
    text-align: left; padding: 10px 12px;
    border-bottom: 1px solid var(--line); vertical-align: top;
  }
  th {
    background: var(--surface); font-weight: 600; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted);
  }
  td.plat { font-weight: 600; color: var(--ink); white-space: nowrap; }
  .badge {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 2px 7px; border: 1px solid var(--line);
    background: var(--paper); color: var(--body); margin-right: 4px;
  }
  .badge.accent { border-color: #a6c8ff; background: var(--accent-soft); color: #002d9c; }
  .badge.ok { border-color: #a7f0ba; background: #defbe6; color: #0e6027; }
  .platform-head {
    display: flex; flex-wrap: wrap; align-items: baseline;
    gap: 8px 14px; margin-bottom: 8px;
  }
  .platform-head h2 { border: 0; margin: 0; padding: 0; }
  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
    background: var(--line); border: 1px solid var(--line); margin: 16px 0 8px;
  }
  .stats > div { background: var(--paper); padding: 14px 16px; }
  .stats .n {
    font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .stats .l {
    font-size: 11px; color: var(--muted); margin-top: 2px;
    text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;
  }
  @media (max-width: 800px) {
    .stats { grid-template-columns: 1fr 1fr; }
    .wrap { padding: 28px 16px 56px; }
  }
  .gallery {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0 8px;
  }
  @media (max-width: 720px) { .gallery { grid-template-columns: 1fr; } }
  .shot {
    border: 1px solid var(--line); background: var(--surface);
    break-inside: avoid; page-break-inside: avoid;
  }
  .shot img {
    display: block; width: 100%; height: auto;
    background: #fff; border-bottom: 1px solid var(--line);
  }
  .shot figcaption {
    padding: 8px 10px; display: flex; justify-content: space-between;
    gap: 8px; align-items: baseline; font-size: 12px; color: var(--body);
  }
  .shot figcaption code { font-family: var(--mono); font-size: 10px; color: var(--muted); }
  ul.compact { margin: 0 0 12px 18px; color: var(--body); }
  ul.compact li { margin: 3px 0; }
  .muted { color: var(--muted); font-size: 13px; }
  .callout {
    border-left: 3px solid var(--accent); background: var(--accent-soft);
    padding: 12px 14px; margin: 14px 0; font-size: 13.5px; color: var(--ink);
  }
  footer.doc {
    margin-top: 56px; padding-top: 16px; border-top: 1px solid var(--line-strong);
    font-size: 12px; color: var(--muted);
  }
  @media print {
    body { font-size: 11.5px; }
    .wrap { padding: 12px; max-width: none; }
    .shot { break-inside: avoid; }
    a { color: inherit; text-decoration: none; }
    .gallery { grid-template-columns: 1fr 1fr; }
    h2 { break-after: avoid; }
  }
</style>
</head>
<body>
<div class="wrap">

<header class="cover">
  <div class="kicker">Clozzy 2028 · Relatório de produto</div>
  <h1>Benchmarking de concorrentes — compilado</h1>
  <p class="deck">Inspeções profundas já entregues: Privacy, CloseFans, FatalFans e Fansly. Matriz de funcionalidades, política de IA e acervo completo de prints (desktop + mobile).</p>
  <div class="meta-row">
    <span><strong>Data</strong> ${today}</span>
    <span><strong>Plataformas</strong> ${data.length}</span>
    <span><strong>Prints</strong> ${totalShots}</span>
    <span><strong>Pasta</strong> <code>clozzy/marca/benchmarking-concorrentes/</code></span>
  </div>
</header>

<nav class="toc" aria-label="Sumário">
  <strong>Sumário</strong>
  <ol>
    <li><a href="#visao">Visão geral</a></li>
    <li><a href="#matriz">Matriz de funcionalidades</a></li>
    <li><a href="#ia">Política e produto de IA</a></li>
    ${data.map((p) => `<li><a href="#${p.id}">${esc(p.name)} — prints e notas</a></li>`).join('\n    ')}
    <li><a href="#fontes">Fontes</a></li>
  </ol>
</nav>

<section id="visao">
  <h2>1. Visão geral</h2>
  <div class="stats">
    <div><div class="n">${data.length}</div><div class="l">Inspeções</div></div>
    <div><div class="n">${totalShots}</div><div class="l">Prints</div></div>
    <div><div class="n">3</div><div class="l">Rivais BR</div></div>
    <div><div class="n">1</div><div class="l">Global (#4)</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Plataforma</th><th>Ranking</th><th>Taxa</th><th>Pix</th>
        <th>Inspeção</th><th>Prints</th><th>Nota</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (p) => `<tr>
        <td class="plat"><a href="${esc(p.url)}">${esc(p.name)}</a></td>
        <td>${esc(p.rank)}</td>
        <td>${esc(p.tax)}</td>
        <td>${esc(p.pix)}</td>
        <td>${esc(p.when)}</td>
        <td>${p.desktop.length + p.mobile.length} <span class="muted">(${p.desktop.length}d / ${p.mobile.length}m)</span></td>
        <td>${esc(p.note)}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>
  <p class="muted">Curadoria macro (#1–#12) em <code>00-curadoria.html</code>. OnlyFans, Patreon, Fanvue e LoyalFans ainda fora deste compilado (fila: Fanvue → LoyalFans).</p>
</section>

<section id="matriz">
  <h2>2. Matriz de funcionalidades</h2>
  <p>Comparativo a partir dos inventários <code>funcionalidades.md</code> de cada pasta.</p>
  <table>
    <thead>
      <tr>
        <th>Capacidade</th><th>Privacy</th><th>CloseFans</th><th>FatalFans</th><th>Fansly</th>
      </tr>
    </thead>
    <tbody>
      ${features
        .map(
          (row) =>
            `<tr>${row.map((c, i) => `<td${i === 0 ? ' class="plat"' : ''}>${esc(c)}</td>`).join('')}</tr>`,
        )
        .join('\n')}
    </tbody>
  </table>
  <div class="callout">
    <strong>Padrão BR:</strong> Pix + taxa ~15–20% + discovery por ranking. CloseFans diferencia com Telegram/CloseBot e packs. FatalFans amarra Fatal Model e taxa 15%. Fansly lidera discovery global (Explore / For You / lives) sem Pix na UI lab.
  </div>
</section>

<section id="ia">
  <h2>3. Política e produto de IA</h2>
  <table>
    <thead>
      <tr><th>Plataforma</th><th>Política</th><th>Suite / tools</th><th>Promessa</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="plat">Privacy</td>
        <td>Artigo help sobre perfil IA</td>
        <td>Sem suite GenAI na UI fan</td>
        <td>Monetização + Pix BR</td>
      </tr>
      <tr>
        <td class="plat">CloseFans</td>
        <td>Ban perfil 100% IA / deepfake</td>
        <td>Sem suite; CloseBot ≠ GenAI</td>
        <td>Site + Telegram</td>
      </tr>
      <tr>
        <td class="plat">FatalFans</td>
        <td>Ban IA ligada a menoridade (Termos 4.10)</td>
        <td>Sem suite</td>
        <td>Taxa 15% + Fatal Model</td>
      </tr>
      <tr>
        <td class="plat">Fansly</td>
        <td>Ban fotorealista (label não libera); ban AI chat sem oversight</td>
        <td>Sem suite</td>
        <td>“Conteúdo humano real”</td>
      </tr>
    </tbody>
  </table>
  <p class="muted">Detalhe: <code>privacy/ia.md</code>, <code>closefans/ia.md</code>, <code>fatalfans/ia.md</code>, <code>fansly/ia.md</code>.</p>
</section>

${data
  .map(
    (p) => `
<section id="${p.id}">
  <div class="platform-head">
    <h2>${esc(p.name)}</h2>
    <span class="badge accent">${esc(p.rank)}</span>
    <span class="badge">${esc(p.when)}</span>
    <span class="badge ok">${p.desktop.length} desktop</span>
    <span class="badge">${p.mobile.length} mobile</span>
  </div>
  <p><a href="${esc(p.url)}">${esc(p.url)}</a> · pasta <code>${p.id}/</code> · ${esc(p.note)}</p>
  <h4>Desktop</h4>
  ${gallery(p.id, p.desktop, 'desktop')}
  <h4>Mobile</h4>
  ${gallery(p.id, p.mobile, 'mobile')}
</section>
`,
  )
  .join('\n')}

<section id="fontes">
  <h2>Fontes</h2>
  <ul class="compact">
    <li>Pastas: <code>privacy/</code>, <code>closefans/</code>, <code>fatalfans/</code>, <code>fansly/</code></li>
    <li>Curadoria macro: <code>00-curadoria.html</code></li>
    <li>Cards Clozzy 2028 · CDPs :9263–:9266</li>
  </ul>
</section>

<footer class="doc">
  Clozzy 2028 · Relatório compilado · ${totalShots} prints · ${today} · visual: relatório claro (IBM Plex / branco)
</footer>

</div>
</body>
</html>
`;

writeFileSync(join(ROOT, 'relatorio-compilado.html'), html);
console.log('OK relatorio-compilado.html · prints', totalShots);
for (const p of data) console.log(' ', p.id, p.desktop.length, 'd', p.mobile.length, 'm');
