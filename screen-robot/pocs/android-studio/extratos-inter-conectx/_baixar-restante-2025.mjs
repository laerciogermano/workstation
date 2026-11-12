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
});

function lastDay(y, m) {
  return new Date(y, m, 0).getDate();
}
function pad(n) {
  return String(n).padStart(2, '0');
}

async function clickText(text) {
  const info = await page.evaluate(`((text) => {
    let best = null;
    for (const el of document.querySelectorAll('a,button,[role=button],span,div,li,label')) {
      const raw = (el.innerText || '').trim().replace(/\\s+/g, ' ');
      if (raw !== text) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.top > innerHeight || r.bottom < 0) continue;
      const score = (el.tagName === 'BUTTON' ? 50 : 0) + (el.children.length === 0 ? 30 : 0);
      if (!best || score > best.score) best = { el, raw, score, tag: el.tagName };
    }
    if (!best) return { ok: false };
    const id = 'hcdp-' + Math.random().toString(36).slice(2, 8);
    best.el.setAttribute('data-human-cdp', id);
    return { ok: true, id, t: best.raw, tag: best.tag };
  })(${JSON.stringify(text)})`);
  if (!info.ok) {
    console.log('  miss', text);
    return false;
  }
  await page.click(`[data-human-cdp="${info.id}"]`);
  await sleep(900);
  return true;
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

await page.goto('https://contadigital.inter.co/extrato');
await sleep(2500);

const jobs = [];
for (let m = 1; m <= 9; m++) {
  const dest = join(OUT, `extrato-2025-${pad(m)}.csv`);
  jobs.push({
    m,
    ini: `01/${pad(m)}/2025`,
    fim: `${pad(lastDay(2025, m))}/${pad(m)}/2025`,
    dest,
  });
}
console.log('jobs', jobs.map((j) => j.m).join(','));

for (const job of jobs) {
  console.log(`\n=== 2025-${pad(job.m)} ===`);
  try {
    await clickText('Fechar');
    await sleep(300);

    if (!(await clickText('Período'))) {
      const open = await page.evaluate(
        `!![...document.querySelectorAll('label')].find(l=>/Data inicial/i.test(l.innerText||''))`,
      );
      if (!open) throw new Error('Período');
    }
    await page.evaluate(`(() => {
      const inputs = [...document.querySelectorAll('input')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2 && (el.placeholder || '').toLowerCase().includes('dd/mm');
      });
      if (inputs.length < 2) throw new Error('dates ' + inputs.length);
      inputs[0].setAttribute('data-human-cdp', 'data-ini');
      inputs[1].setAttribute('data-human-cdp', 'data-fim');
    })()`);
    await page.fill('[data-human-cdp="data-ini"]', job.ini);
    await sleep(200);
    await page.fill('[data-human-cdp="data-fim"]', job.fim);
    await sleep(200);
    if (!(await clickText('Filtrar'))) throw new Error('Filtrar');
    await sleep(2500);
    const snap = await page.evaluate(`(() => {
      const t = (document.body.innerText || '').replace(/\\s+/g, ' ');
      const hasEmpty = /nenhum lançamento|sem lançamento|não encontramos|nao encontramos|sem moviment/i.test(t);
      const dateHits = (t.match(/\\d{2}\\/\\d{2}\\/2025/g) || []).length;
      return { hasEmpty, dateHits, head: t.slice(0, 400) };
    })()`);
    console.log('  snap', JSON.stringify(snap));

    const before = new Set(readdirSync(OUT));
    if (!(await clickText('Exportar'))) throw new Error('Exportar');
    await sleep(1200);

    const csv = await page.evaluate(`(() => {
      const spans = [...document.querySelectorAll('span,div,label')].filter((el) => {
        if ((el.innerText || '').trim() !== 'CSV') return false;
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2 && r.top >= 0 && r.top < innerHeight;
      });
      if (!spans.length) return { ok: false };
      const leaf = spans.sort((a, b) => a.children.length - b.children.length)[0];
      const root = leaf.closest('div,label') || leaf.parentElement;
      const input =
        root?.querySelector('input[type=checkbox]') ||
        leaf.parentElement?.querySelector('input[type=checkbox]');
      const id = 'csv-' + Math.random().toString(36).slice(2, 6);
      if (input) {
        input.setAttribute('data-human-cdp', id);
        return { ok: true, id, kind: 'checkbox', checked: !!input.checked };
      }
      leaf.setAttribute('data-human-cdp', id);
      return { ok: true, id, kind: 'leaf' };
    })()`);
    console.log('  csv', csv);
    if (!csv.ok) throw new Error('CSV');
    if (!(csv.kind === 'checkbox' && csv.checked)) {
      await page.click(`[data-human-cdp="${csv.id}"]`);
      await sleep(400);
    }
    if (!(await clickText('Continuar'))) throw new Error('Continuar');
    const got = await waitNewCsv(before);
    if (!got) throw new Error('timeout');
    if (existsSync(job.dest)) {
      try {
        renameSync(job.dest, job.dest + '.old');
      } catch {}
    }
    renameSync(got, job.dest);
    console.log('  OK', statSync(job.dest).size);
  } catch (e) {
    console.error('  FAIL', e.message);
    await page.goto('https://contadigital.inter.co/extrato');
    await sleep(2500);
  }
}

console.log('\n=== FINAL ===');
const reRow = /^\d{2}\/\d{2}\/\d{4};/;
for (const f of readdirSync(OUT)
  .filter((f) => /^extrato-20(25|26)-\d{2}\.csv$/.test(f))
  .sort()) {
  const p = join(OUT, f);
  const txt = readFileSync(p, 'utf8');
  const rows = txt.split('\n').filter((l) => reRow.test(l)).length;
  console.log(f.padEnd(22), String(statSync(p).size).padStart(6), 'rows', rows);
}
page.close();
