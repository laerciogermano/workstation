#!/usr/bin/env node
/**
 * Mapeia o Portal Franqueado ConectMax via CDP Germano (:9230):
 * prints + inventário de UI (menu, filtros, botões, tabelas).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectCdp } from '../../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const SHOTS = join(OUT, 'screenshots');
mkdirSync(SHOTS, { recursive: true });

const BASE = 'https://franqueado.conectmax.com/franqueado';
const PAGES = [
  { id: 'dashboard', page: 'dashboard', label: 'Dashboard' },
  { id: 'orcamentos', page: 'orcamentos', label: 'Orçamentos' },
  { id: 'pedidos', page: 'pedidos', label: 'Pedidos' },
  { id: 'notas_fiscais', page: 'notas_fiscais', label: 'Notas fiscais' },
  { id: 'contasareceber', page: 'contasareceber', label: 'Contas a receber' },
  { id: 'faturamento', page: 'faturamento', label: 'Faturamento' },
  { id: 'fluxo_previsto', page: 'fluxo_previsto', label: 'Fluxo previsto' },
  { id: 'chamados', page: 'chamados', label: 'Chamados' },
  { id: 'notificacoes', page: 'notificacoes', label: 'Notificações' },
];

function loadCreds() {
  const raw = readFileSync(
    `${process.env.HOME}/.config/conectmax-franqueado/credentials.env`,
    'utf8',
  );
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitReady(page, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const st = await page.evaluate('document.readyState');
    if (st === 'complete' || st === 'interactive') return;
    await sleep(200);
  }
}

async function ensureLogin(page, creds) {
  const href = await page.evaluate('location.href');
  const needsLogin =
    /login\.php/i.test(href) ||
    !!(await page.evaluate(
      `!!(document.querySelector('input[name="usuario"], #usuario, input[type="password"]'))`,
    ));
  if (!needsLogin && /franqueado\/(\?|$|index)/i.test(href)) return false;

  await page.goto(`${BASE}/login.php`, { timeoutMs: 30000 });
  await waitReady(page);
  await sleep(800);

  const userSel = await page.evaluate(`(() => {
    const el = document.querySelector('input[name="usuario"], #usuario, input[type="text"], input[type="email"]');
    if (!el) return null;
    if (!el.id) el.id = 'cm-user';
    return '#' + el.id;
  })()`);
  const passSel = await page.evaluate(`(() => {
    const el = document.querySelector('input[name="senha"], #senha, input[type="password"]');
    if (!el) return null;
    if (!el.id) el.id = 'cm-pass';
    return '#' + el.id;
  })()`);
  if (!userSel || !passSel) throw new Error('Login: campos usuario/senha não encontrados');

  await page.fill(userSel, creds.CONECTMAX_FRANQUEADO_USER);
  await page.fill(passSel, creds.CONECTMAX_FRANQUEADO_PASS);

  const btn = await page.evaluate(`(() => {
    const b = document.querySelector('button[type="submit"], input[type="submit"], .btn-login, #btn-login, button');
    if (!b) return null;
    if (!b.id) b.id = 'cm-login-btn';
    return '#' + b.id;
  })()`);
  if (btn) await page.click(btn);
  else await page.evaluate(`document.querySelector('form')?.submit()`);

  await sleep(2500);
  await waitReady(page, 15000);
  const after = await page.evaluate('location.href');
  if (/login\.php/i.test(after)) throw new Error('Login falhou — ainda em login.php');
  return true;
}

const EXTRACT_JS = `(() => {
  const text = (el) => (el?.innerText || el?.textContent || '').replace(/\\s+/g, ' ').trim();
  const abs = (href) => {
    try { return new URL(href, location.href).href; } catch { return href; }
  };

  const menu = [...document.querySelectorAll('aside a, .sidebar a, .sidemenu a, .menu a, nav a, #sidebar a, .nav a')]
    .map((a) => ({
      text: text(a).slice(0, 120),
      href: abs(a.getAttribute('href') || ''),
      page: (a.getAttribute('href') || '').match(/[?&]page=([^&]+)/)?.[1] || null,
    }))
    .filter((x) => x.text || x.page);

  // dedupe by href+text
  const seen = new Set();
  const menuUnique = [];
  for (const m of menu) {
    const k = m.href + '|' + m.text;
    if (seen.has(k)) continue;
    seen.add(k);
    menuUnique.push(m);
  }

  const headings = [...document.querySelectorAll('h1,h2,h3,.page-title,.titulo,.content-header h1')]
    .map((h) => text(h).slice(0, 160))
    .filter(Boolean)
    .slice(0, 12);

  const filters = [...document.querySelectorAll('form input, form select, form textarea')]
    .filter((el) => el.type !== 'hidden' && el.type !== 'submit')
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.type || null,
      name: el.name || null,
      id: el.id || null,
      placeholder: el.placeholder || null,
      label: text(el.closest('label') || el.parentElement?.querySelector('label'))?.slice(0, 80) || null,
      options: el.tagName === 'SELECT'
        ? [...el.options].slice(0, 30).map((o) => o.text.trim()).filter(Boolean)
        : null,
    }))
    .slice(0, 40);

  const buttons = [...document.querySelectorAll('button, a.btn, .btn, input[type="submit"], input[type="button"]')]
    .map((el) => ({
      text: text(el).slice(0, 80) || el.value || el.title || el.getAttribute('aria-label') || '',
      tag: el.tagName.toLowerCase(),
      href: el.tagName === 'A' ? abs(el.getAttribute('href') || '') : null,
      classes: (el.className || '').toString().slice(0, 80),
    }))
    .filter((b) => b.text)
    .slice(0, 50);

  const tables = [...document.querySelectorAll('table')].slice(0, 6).map((t, i) => {
    const headers = [...t.querySelectorAll('thead th, tr:first-child th, tr:first-child td')]
      .map((c) => text(c).slice(0, 60))
      .filter(Boolean);
    const rows = t.querySelectorAll('tbody tr, tr').length;
    return { index: i, headers: headers.slice(0, 20), approxRows: rows };
  });

  const cards = [...document.querySelectorAll('.card, .info-box, .small-box, .stat, .kpi, .box')]
    .map((c) => text(c).slice(0, 140))
    .filter((t) => t.length > 3)
    .slice(0, 20);

  const linksPage = [...document.querySelectorAll('a[href*="page="]')]
    .map((a) => ({
      text: text(a).slice(0, 80),
      page: (a.getAttribute('href') || '').match(/[?&]page=([^&]+)/)?.[1] || null,
      href: abs(a.getAttribute('href') || ''),
    }))
    .filter((x) => x.page)
    .slice(0, 80);

  return {
    url: location.href,
    title: document.title,
    bodySample: text(document.body).slice(0, 400),
    headings,
    menu: menuUnique.slice(0, 60),
    filters,
    buttons: buttons.slice(0, 40),
    tables,
    cards,
    linksPage,
  };
})()`;

function fixPortalUrl(u) {
  return String(u).replace(/\/franqueado\/(?:franqueado\/)+/g, '/franqueado/');
}

async function capturePage(page, meta) {
  const url = fixPortalUrl(`${BASE}/?page=${meta.page}`);
  await page.goto(url, { timeoutMs: 35000 });
  await waitReady(page, 15000);
  await sleep(1200);

  // scroll top then mid for fuller context; screenshot viewport
  await page.evaluate('window.scrollTo(0,0)');
  await sleep(300);

  const shotPath = join(SHOTS, `${meta.id}.png`);
  const buf = await page.screenshot();
  writeFileSync(shotPath, buf);

  const data = await page.evaluate(EXTRACT_JS);
  return { ...meta, shot: `screenshots/${meta.id}.png`, data };
}

function mdEscape(s) {
  return String(s || '').replace(/\|/g, '\\|');
}

function renderDoc(results, extraPages, loggedIn) {
  const now = new Date().toISOString();
  const menuFromDash =
    results.find((r) => r.id === 'dashboard')?.data?.menu || [];

  let md = `# Mapa visual — Portal Franqueado ConectMax

**Gerado:** ${now}  
**Fonte:** CDP perfil \`germano\` (:9230) + human-cdp  
**URL base:** https://franqueado.conectmax.com/franqueado/  
**Login:** ${loggedIn ? 'realizado nesta sessão' : 'sessão já autenticada / reutilizada'}  
**Script:** [\`mapear-portal-cdp.mjs\`](mapear-portal-cdp.mjs)

Documento de inventário UI (prints + funcionalidades observadas). Complementa [\`portal-franqueado.md\`](../portal-franqueado.md) e [\`../../portal-api/GETS.md\`](../../portal-api/GETS.md).

## Índice das telas

| Tela | \`page\` | Print |
|---|---|---|
`;
  for (const r of results) {
    md += `| ${r.label} | \`${r.page}\` | [![${r.id}](${r.shot})](${r.shot}) |\n`;
  }

  md += `
## Menu observado (shell)

`;
  if (menuFromDash.length) {
    md += `| Texto | \`page\` | href |\n|---|---|---|\n`;
    for (const m of menuFromDash) {
      md += `| ${mdEscape(m.text)} | ${m.page ? '`' + m.page + '`' : '—'} | \`${mdEscape(m.href)}\` |\n`;
    }
  } else {
    md += `_Menu lateral não encontrado via seletores genéricos; ver links \`page=\` em cada tela._\n`;
  }

  if (extraPages.length) {
    md += `
## Páginas \`page=\` descobertas além do catálogo inicial

`;
    for (const p of [...new Set(extraPages)].sort()) {
      md += `- \`${p}\`\n`;
    }
  }

  for (const r of results) {
    const d = r.data || {};
    md += `
---

## ${r.label} (\`?page=${r.page}\`)

![${r.label}](${r.shot})

- **URL:** ${d.url || '—'}
- **Title:** ${mdEscape(d.title)}
- **Headings:** ${(d.headings || []).map((h) => mdEscape(h)).join(' · ') || '—'}

### Funcionalidades / UI

`;
    if (d.cards?.length) {
      md += `**Cards / KPIs**\n\n`;
      for (const c of d.cards) md += `- ${mdEscape(c)}\n`;
      md += `\n`;
    }

    if (d.filters?.length) {
      md += `**Filtros / campos de formulário**\n\n| name/id | tipo | label/placeholder | opções |\n|---|---|---|---|\n`;
      for (const f of d.filters) {
        const key = f.name || f.id || '—';
        const lab = f.label || f.placeholder || '—';
        const opts = f.options?.length ? f.options.slice(0, 12).join(', ') : '—';
        md += `| \`${mdEscape(key)}\` | ${f.tag}${f.type ? '/' + f.type : ''} | ${mdEscape(lab)} | ${mdEscape(opts)} |\n`;
      }
      md += `\n`;
    }

    if (d.buttons?.length) {
      md += `**Botões / CTAs**\n\n`;
      for (const b of d.buttons.slice(0, 25)) {
        md += `- ${mdEscape(b.text)}${b.href ? ` → \`${mdEscape(b.href)}\`` : ''}\n`;
      }
      md += `\n`;
    }

    if (d.tables?.length) {
      md += `**Tabelas**\n\n`;
      for (const t of d.tables) {
        md += `- Tabela #${t.index}: ~${t.approxRows} linhas · colunas: ${t.headers.map(mdEscape).join(' | ') || '(sem thead)'}\n`;
      }
      md += `\n`;
    }

    md += `### Amostra de texto (viewport)

\`\`\`
${(d.bodySample || '').slice(0, 350)}
\`\`\`
`;
  }

  md += `
---

## Funil (resumo operacional)

Orçamento → Pedido → Nota fiscal → Contas a receber → Faturado. Detalhe em [\`portal-franqueado.md\`](../portal-franqueado.md).

## Caminho inverso

- Apagar esta pasta: \`rm -rf conectmax/connectmax/docs/portal-mapa\`
- Regenerar: \`node conectmax/connectmax/docs/portal-mapa/mapear-portal-cdp.mjs\` (Chrome Germano CDP :9230 up)
- Doc técnico sem prints: manter só \`portal-franqueado.md\` / \`GETS.md\`
`;

  return md;
}

async function main() {
  const creds = loadCreds();
  const page = await connectCdp('germano');
  let loggedIn = false;

  try {
    await page.goto(`${BASE}/?page=dashboard`, { timeoutMs: 35000 });
    await waitReady(page);
    await sleep(1000);
    loggedIn = await ensureLogin(page, creds);

    const results = [];
    const discovered = new Set();

    for (const meta of PAGES) {
      process.stderr.write(`→ ${meta.id}…\n`);
      const r = await capturePage(page, meta);
      results.push(r);
      for (const l of r.data?.linksPage || []) if (l.page) discovered.add(l.page);
      for (const m of r.data?.menu || []) if (m.page) discovered.add(m.page);
      writeFileSync(join(OUT, `${meta.id}.json`), JSON.stringify(r, null, 2));
    }

    const known = new Set(PAGES.map((p) => p.page));
    const extra = [...discovered].filter((p) => !known.has(p));

    const md = renderDoc(results, extra, loggedIn);
    writeFileSync(join(OUT, 'README.md'), md);
    writeFileSync(join(OUT, 'mapa.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results, extraPages: extra }, null, 2));
    console.log(JSON.stringify({ ok: true, pages: results.length, shots: SHOTS, doc: join(OUT, 'README.md'), extra }, null, 2));
  } finally {
    page.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
