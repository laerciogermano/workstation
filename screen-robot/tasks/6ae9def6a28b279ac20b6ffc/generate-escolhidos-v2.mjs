#!/usr/bin/env node
/**
 * Gera MD + HTML (mock LinkedIn) + PDF dos 6 escolhidos.
 * Uso: node generate-escolhidos-v2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const OUT = path.join(ROOT, 'reports');
fs.mkdirSync(OUT, { recursive: true });

const BANNERS = {
  v04: 'banners/br-supply-01-caixas.jpg',
  v05: 'banners/br-supply-02-fachada.jpg',
  v06: 'banners/br-supply-03-logistica.jpg',
  v09: 'banners/br-supply-01-caixas.jpg',
  v11: 'banners/br-supply-02-fachada.jpg',
  v12: 'banners/br-supply-03-logistica.jpg',
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const sellers = parseCsv(fs.readFileSync(path.join(ROOT, 'vendedores.csv'), 'utf8'));
const expAll = parseCsv(fs.readFileSync(path.join(ROOT, 'experiencia-por-vendedor.csv'), 'utf8'));
const fontes = Object.fromEntries(
  parseCsv(fs.readFileSync(path.join(ROOT, 'fontes-foto-escolhida.csv'), 'utf8')).map((r) => [r.id, r]),
);

function expFor(id) {
  return expAll.filter((e) => e.vendedor_id === id).sort((a, b) => Number(a.ordem) - Number(b.ordem));
}

// —— MD ——
let md = `# Escolhidos v2.1 (Sobre + Experiência enriquecidos) — persona × LinkedIn (layout página)

PDF: [\`reports/Vendedores-escolhidos-v2.1-sobre-experiencia.pdf\`](reports/Vendedores-escolhidos-v2-linkedin-layout.pdf)

Base: seleção final [\`../6ae9db12f2929dff03af4f93/\`](../6ae9db12f2929dff03af4f93/README.md) · banners BR Supply [\`../6ae9dc16dd4a9cb567b8f5cd/\`](../6ae9dc16dd4a9cb567b8f5cd/README.md).

Cada vendedor: **A) Perfil/persona** (interno) + **B) mock da página LinkedIn** (banner + foto + sobre + experiência).

| ID | Nome | Persona | Banner |
|---|---|---|---|
`;

for (const s of sellers) {
  md += `| ${s.id} | ${s.li_first} ${s.li_last} | \`${s.persona_id}\` | \`${path.basename(BANNERS[s.id])}\` |\n`;
}
md += '\n';

for (const s of sellers) {
  const name = `${s.li_first} ${s.li_last}`;
  const f = fontes[s.id] || {};
  const exps = expFor(s.id);
  md += `---\n\n## ${s.id} · ${name}\n\n`;
  md += `### A) Perfil / persona\n\n`;
  md += `| Campo | Valor |\n|---|---|\n`;
  md += `| \`persona_id\` | \`${s.persona_id}\` (${s.persona_label}) |\n`;
  md += `| Por que encaixa | ${s.pessoa_porque_persona} |\n`;
  md += `| Idade / faixa | ${s.pessoa_idade_faixa} |\n`;
  md += `| Aparência | ${s.pessoa_aparencia} |\n`;
  md += `| \`avatar_style\` | ${s.pessoa_avatar_style} |\n`;
  md += `| Experiência | ${s.pessoa_experiencia_anos} — ${s.pessoa_experiencia_detalhe} |\n`;
  md += `| Foto (fonte) | ${f.fonte || ''} · ${f.credito || ''} |\n\n`;

  md += `### B) Vendedor / LinkedIn (página)\n\n`;
  md += `- **Banner:** \`${BANNERS[s.id]}\`\n`;
  md += `- **Foto:** \`${s.li_avatar_file}\`\n`;
  md += `- **Nome:** ${name}\n`;
  md += `- **Headline:** ${s.li_headline}\n`;
  md += `- **Local:** ${s.li_location}\n`;
  md += `- **Empresa atual:** ${s.li_company}\n`;
  md += `- **Sobre:** ${s.li_about}\n`;
  md += `- **Experiência:**\n`;
  for (const e of exps) {
    md += `  - ${e.atual === 'sim' ? '**Atual** · ' : ''}${e.titulo} @ ${e.empresa} (${e.periodo}) — ${e.descricao}\n`;
  }
  md += '\n';
}

fs.writeFileSync(path.join(ROOT, 'escolhidos-v2.1.md'), md);
console.log('MD', path.join(ROOT, 'escolhidos-v2.1.md'));

// —— HTML ——
const css = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #191919; background: #fff; font-size: 11.5px; line-height: 1.45;
  }
  .cover {
    page-break-after: always; padding: 48px 24px;
  }
  .cover h1 { font-size: 26px; margin: 0 0 8px; color: #0a66c2; }
  .cover p { color: #666; max-width: 520px; }
  .cover table { border-collapse: collapse; margin-top: 28px; width: 100%; }
  .cover th, .cover td { border-bottom: 1px solid #e0e0e0; text-align: left; padding: 8px 6px; font-size: 12px; }
  .vendor { page-break-after: always; }
  .vendor:last-child { page-break-after: auto; }
  .sec-label {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; color: #0a66c2; margin: 0 0 10px;
  }
  .persona {
    background: #f3f6f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;
  }
  .persona h2 { margin: 0 0 10px; font-size: 16px; }
  .persona dl { display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; margin: 0; }
  .persona dt { color: #666; font-weight: 600; }
  .persona dd { margin: 0; }
  .li-card {
    border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #fff;
    box-shadow: 0 0 0 1px rgba(0,0,0,.04);
  }
  .li-banner {
    height: 118px; width: 100%; object-fit: cover; display: block; background: #dce6f1;
  }
  .li-top { padding: 0 16px 14px; position: relative; }
  .li-avatar {
    width: 96px; height: 96px; border-radius: 50%; object-fit: cover;
    border: 3px solid #fff; margin-top: -48px; background: #ccc; display: block;
  }
  .li-actions { position: absolute; right: 16px; top: 12px; display: flex; gap: 8px; }
  .btn {
    border-radius: 16px; padding: 6px 14px; font-size: 12px; font-weight: 600;
    border: 1px solid #0a66c2; color: #0a66c2; background: #fff;
  }
  .btn.primary { background: #0a66c2; color: #fff; }
  .li-name { font-size: 18px; font-weight: 650; margin: 8px 0 2px; }
  .li-headline { color: #191919; margin: 0 0 4px; font-size: 12.5px; }
  .li-meta { color: #666; font-size: 12px; margin: 0; }
  .li-company-line { color: #191919; font-size: 12px; margin: 4px 0 0; }
  .li-block { border-top: 1px solid #e0e0e0; padding: 12px 16px; }
  .li-block h3 { margin: 0 0 8px; font-size: 14px; }
  .exp { display: grid; grid-template-columns: 40px 1fr; gap: 10px; margin-bottom: 12px; }
  .exp-ico {
    width: 40px; height: 40px; border-radius: 4px; background: #e8f0fe; color: #0a66c2;
    display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px;
  }
  .exp h4 { margin: 0 0 2px; font-size: 13px; }
  .exp .co { font-weight: 600; color: #191919; }
  .exp .per { color: #666; font-size: 11.5px; }
  .exp p { margin: 4px 0 0; color: #191919; }
  .badge-atual {
    display: inline-block; font-size: 10px; background: #e8f5e9; color: #2e7d32;
    padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600;
  }
`;

function personaBlock(s) {
  return `
    <div class="persona">
      <div class="sec-label">A · Perfil / persona</div>
      <h2>${esc(s.li_first)} ${esc(s.li_last)} · ${esc(s.id)}</h2>
      <dl>
        <dt>persona_id</dt><dd><code>${esc(s.persona_id)}</code> — ${esc(s.persona_label)}</dd>
        <dt>Por que encaixa</dt><dd>${esc(s.pessoa_porque_persona)}</dd>
        <dt>Idade / faixa</dt><dd>${esc(s.pessoa_idade_faixa)}</dd>
        <dt>Aparência</dt><dd>${esc(s.pessoa_aparencia)}</dd>
        <dt>avatar_style</dt><dd>${esc(s.pessoa_avatar_style)}</dd>
        <dt>Experiência</dt><dd>${esc(s.pessoa_experiencia_anos)} — ${esc(s.pessoa_experiencia_detalhe)}</dd>
        <dt>Foto (fonte)</dt><dd>${esc((fontes[s.id] || {}).fonte)} · ${esc((fontes[s.id] || {}).credito)}</dd>
      </dl>
    </div>`;
}

function liBlock(s) {
  const exps = expFor(s.id);
  const banner = BANNERS[s.id];
  const avatar = s.li_avatar_file.startsWith('avatars/') ? s.li_avatar_file : `avatars/${path.basename(s.li_avatar_file)}`;
  const expHtml = exps
    .map((e) => {
      const initials = (e.empresa || 'BR')
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
      return `
        <div class="exp">
          <div class="exp-ico">${esc(initials)}</div>
          <div>
            <h4>${esc(e.titulo)}${e.atual === 'sim' ? '<span class="badge-atual">Atual</span>' : ''}</h4>
            <div class="co">${esc(e.empresa)}</div>
            <div class="per">${esc(e.periodo)} · ${esc(e.anos)} ano(s)</div>
            <p>${esc(e.descricao)}</p>
          </div>
        </div>`;
    })
    .join('');

  return `
    <div class="li-card">
      <div class="sec-label" style="padding:10px 16px 0">B · Vendedor / LinkedIn (layout página)</div>
      <img class="li-banner" src="../${banner}" alt="banner" />
      <div class="li-top">
        <div class="li-actions">
          <span class="btn">Mensagem</span>
          <span class="btn primary">Conectar</span>
        </div>
        <img class="li-avatar" src="../${avatar}" alt="foto" />
        <div class="li-name">${esc(s.li_first)} ${esc(s.li_last)}</div>
        <p class="li-headline">${esc(s.li_headline)}</p>
        <p class="li-meta">${esc(s.li_location)} · Brasil</p>
        <p class="li-company-line">${esc(s.li_company)} · ${esc(s.li_job)}</p>
      </div>
      <div class="li-block">
        <h3>Sobre</h3>
        <p>${esc(s.li_about)}</p>
      </div>
      <div class="li-block">
        <h3>Experiência</h3>
        ${expHtml}
      </div>
    </div>`;
}

const coverRows = sellers
  .map(
    (s) =>
      `<tr><td>${esc(s.id)}</td><td>${esc(s.li_first)} ${esc(s.li_last)}</td><td><code>${esc(s.persona_id)}</code></td><td>${esc(path.basename(BANNERS[s.id]))}</td></tr>`,
  )
  .join('');

const vendorPages = sellers
  .map(
    (s) => `
  <section class="vendor">
    ${personaBlock(s)}
    ${liBlock(s)}
  </section>`,
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Escolhidos v2.1 (Sobre + Experiência enriquecidos) — persona × LinkedIn</title>
<style>${css}</style>
</head>
<body>
  <section class="cover">
    <h1>Escolhidos v2.1 (Sobre + Experiência enriquecidos)</h1>
    <p>Persona (interno) + mock da página LinkedIn (banner BR Supply + foto escolhida + sobre + experiência). Seis vendedores da seleção final.</p>
    <table>
      <thead><tr><th>ID</th><th>Nome</th><th>Persona</th><th>Banner</th></tr></thead>
      <tbody>${coverRows}</tbody>
    </table>
  </section>
  ${vendorPages}
</body>
</html>`;

const htmlPath = path.join(OUT, 'escolhidos-v2.html');
fs.writeFileSync(htmlPath, html);
console.log('HTML', htmlPath);

const pdfPath = path.join(OUT, 'Vendedores-escolhidos-v2.1-sobre-experiencia.pdf');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const r = spawnSync(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`,
  ],
  { encoding: 'utf8', timeout: 60000 },
);
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}
console.log('PDF', pdfPath, fs.statSync(pdfPath).size);
