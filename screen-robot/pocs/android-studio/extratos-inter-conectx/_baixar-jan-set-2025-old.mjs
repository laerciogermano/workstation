import { connect } from '../../chrome-cdp/human-cdp/src/index.mjs';
import { readdirSync, renameSync, existsSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OUT = dirname(fileURLToPath(import.meta.url));
const page = await connect({
  cdpUrl: 'http://127.0.0.1:9230',
  urlIncludes: 'contadigital.inter.co',
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.send('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: OUT,
  eventsEnabled: true,
}).catch(() => {});

function lastDay(y, m) {
  return new Date(y, m, 0).getDate();
}
function pad(n) {
  return String(n).padStart(2, '0');
}

await page.goto('https://contadigital.inter.co/extrato-old');
await sleep(3000);

async function openDatePicker() {
  const info = await page.evaluate(`(() => {
    let best = null;
    for (const el of document.querySelectorAll('div,span,button')) {
      const t = (el.innerText || '').trim().replace(/\\s+/g, ' ');
      if (!/^\\d{2}\\/\\d{2}\\/\\d{4}\\s*-\\s*\\d{2}\\/\\d{2}\\/\\d{4}$/.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 50 || r.height < 10) continue;
      if (!best || r.width > best.w) best = { x: r.x, y: r.y, w: r.width, t };
    }
    if (!best) return { ok: false };
    for (const el of document.querySelectorAll('div,span,button')) {
      const t = (el.innerText || '').trim().replace(/\\s+/g, ' ');
      if (t !== best.t) continue;
      const r = el.getBoundingClientRect();
      if (Math.abs(r.x - best.x) < 1 && Math.abs(r.y - best.y) < 1) {
        el.setAttribute('data-human-cdp', 'daterange');
        return { ok: true, t: best.t };
      }
    }
    return { ok: false };
  })()`);
  if (!info?.ok) throw new Error('daterange');
  await page.click('[data-human-cdp="daterange"]');
  await sleep(800);
}

async function setDates(ini, fim) {
  await openDatePicker();
  const marked = await page.evaluate(`(() => {
    const picks = [...document.querySelectorAll('input')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.top < 0 || r.top > innerHeight) return false;
      const key = ((el.id || '') + (el.name || '') + (el.placeholder || '')).toLowerCase();
      return key.includes('datepicker') || key.includes('start') || key.includes('end') || /^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(el.value || '');
    });
    if (picks.length < 2) return { ok: false, n: picks.length };
    picks[0].setAttribute('data-human-cdp', 'ini');
    picks[1].setAttribute('data-human-cdp', 'fim');
    return { ok: true, a: picks[0].value, b: picks[1].value };
  })()`);
  if (!marked?.ok) throw new Error('date inputs ' + marked?.n);
  await page.fill('[data-human-cdp="ini"]', ini);
  await sleep(200);
  await page.fill('[data-human-cdp="fim"]', fim);
  await sleep(200);
  const applied = await page.evaluate(`(() => {
    for (const el of document.querySelectorAll('button,span,div,a')) {
      const t = (el.innerText || '').trim();
      if (!/^(Aplicar|Filtrar|OK|Confirmar|Buscar)$/i.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      el.setAttribute('data-human-cdp', 'apply');
      return t;
    }
    return null;
  })()`);
  console.log('  apply', applied);
  if (applied) {
    await page.click('[data-human-cdp="apply"]');
  } else {
    await page.click('[data-human-cdp="fim"]');
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
  }
  await sleep(2800);
}

async function pageSnap() {
  return page.evaluate(`(() => {
    const t = document.body.innerText || '';
    return {
      empty: /nenhum|sem lan[cç]amento|n[aã]o (h[aá]|encontr)|sem moviment/i.test(t),
      range: (t.match(/\\d{2}\\/\\d{2}\\/\\d{4}\\s*-\\s*\\d{2}\\/\\d{2}\\/\\d{4}/) || [''])[0],
      money: (t.match(/R\\$\\s*[\\d.]+,\\d{2}/g) || []).length,
      head: t.replace(/\\s+/g, ' ').slice(0, 280),
    };
  })()`);
}

async function waitNewCsv(before, ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await sleep(300);
    const neu = readdirSync(OUT).filter(
      (f) => !before.has(f) && f.toLowerCase().endsWith('.csv') && !f.endsWith('.crdownload'),
    );
    if (neu.length) {
      return join(
        OUT,
        neu.sort(
          (a, b) =>
            statSync(join(OUT, b)).mtimeMs - statSync(join(OUT, a)).mtimeMs,
        )[0],
      );
    }
  }
  return null;
}

async function exportCsv(dest) {
  const before = new Set(readdirSync(OUT));
  const ex = await page.evaluate(`(() => {
    let best = null;
    for (const el of document.querySelectorAll('button,a,span,div')) {
      const t = (el.innerText || '').trim();
      if (t !== 'EXPORTAR' && t !== 'Exportar') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const score = (el.tagName === 'BUTTON' ? 100 : 0) + Math.min(r.width, 200);
      if (!best || score > best.score) best = { score, x: r.x, y: r.y, t };
    }
    if (!best) return { ok: false };
    for (const el of document.querySelectorAll('button,a,span,div')) {
      const t = (el.innerText || '').trim();
      if (t !== best.t) continue;
      const r = el.getBoundingClientRect();
      if (Math.abs(r.x - best.x) < 1 && Math.abs(r.y - best.y) < 1) {
        el.setAttribute('data-human-cdp', 'export');
        return { ok: true, t: best.t };
      }
    }
    return { ok: false };
  })()`);
  if (!ex?.ok) throw new Error('EXPORTAR');
  await page.click('[data-human-cdp="export"]');
  await sleep(1200);

  const csv = await page.evaluate(`(() => {
    for (const el of document.querySelectorAll('span,div,label,button,li')) {
      const t = (el.innerText || '').trim();
      if (t !== 'CSV' && t !== '.csv' && t !== 'Arquivo CSV') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.top < 0 || r.top > innerHeight) continue;
      el.setAttribute('data-human-cdp', 'csvopt');
      return { ok: true, t };
    }
    return { ok: false };
  })()`);
  console.log('  csv', csv);
  if (csv.ok) {
    await page.click('[data-human-cdp="csvopt"]');
    await sleep(400);
    const cont = await page.evaluate(`(() => {
      for (const el of document.querySelectorAll('button,span,div,a')) {
        const t = (el.innerText || '').trim();
        if (!/^(Continuar|Confirmar|Exportar|Baixar|Download)$/i.test(t)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        el.setAttribute('data-human-cdp', 'go');
        return t;
      }
      return null;
    })()`);
    console.log('  go', cont);
    if (cont) await page.click('[data-human-cdp="go"]');
  }

  const got = await waitNewCsv(before);
  if (!got) throw new Error('timeout download');
  if (existsSync(dest)) {
    try {
      renameSync(dest, dest + '.old');
    } catch {}
  }
  renameSync(got, dest);
  return statSync(dest).size;
}

function countRows(file) {
  const txt = readFileSync(file, 'utf8');
  return txt.split('\n').filter((l) => /^\d{2}\/\d{2}\/\d{4};/.test(l)).length;
}

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9];
for (const m of months) {
  const dest = join(OUT, `extrato-2025-${pad(m)}.csv`);
  const ini = `01/${pad(m)}/2025`;
  const fim = `${pad(lastDay(2025, m))}/${pad(m)}/2025`;
  console.log(`\n=== 2025-${pad(m)} ${ini}..${fim} ===`);
  try {
    await setDates(ini, fim);
    console.log('  snap', await pageSnap());
    const size = await exportCsv(dest);
    console.log('  OK', size, 'rows', countRows(dest));
  } catch (e) {
    console.error('  FAIL', e.message);
    await page.goto('https://contadigital.inter.co/extrato-old');
    await sleep(2800);
  }
}

console.log('\n=== FINAL ===');
for (const f of readdirSync(OUT)
  .filter((f) => /^extrato-2025-\d{2}\.csv$/.test(f))
  .sort()) {
  const p = join(OUT, f);
  console.log(f.padEnd(22), String(statSync(p).size).padStart(6), 'rows', countRows(p));
}
page.close();
