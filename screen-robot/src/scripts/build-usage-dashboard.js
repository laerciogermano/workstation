#!/usr/bin/env node
/**
 * Relatório HTML de tokens a partir de usage/*.json.
 *
 * Uso:
 *   node scripts/build-usage-dashboard.js
 *   npm run usage:report
 *
 * Saída: usage/dashboard.html
 * Rollback: remover este script, o npm script e usage/dashboard.html.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
const usageDir = join(SRC_ROOT, "usage");
const out = join(usageDir, "dashboard.html");

const rows = readdirSync(usageDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const j = JSON.parse(readFileSync(join(usageDir, f), "utf8"));
    const u = j.usage || j.output?.raw?.usageMetadata || {};
    return {
      file: f,
      run: j.run ?? "—",
      step: j.step ?? 0,
      at: j.at ?? f,
      model: j.model ?? "—",
      ok: j.ok !== false,
      ms: j.ms ?? 0,
      promptChars: j.promptChars ?? 0,
      systemChars: j.systemChars ?? 0,
      prompt: u.promptTokenCount ?? 0,
      candidates: u.candidatesTokenCount ?? 0,
      total: u.totalTokenCount ?? 0,
      acao: j.acao?.type ?? (typeof j.acao === "string" ? j.acao : "—"),
    };
  })
  .filter((r) => r.total > 0)
  .sort((a, b) => String(a.at).localeCompare(String(b.at)));

const byRun = {};
for (const r of rows) {
  (byRun[r.run] ??= []).push(r);
}

const generatedAt = new Date().toISOString();

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Relatório de tokens — screen-robot usage</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  :root {
    --bg: #0f1115;
    --panel: #1a1d24;
    --text: #e8eaed;
    --muted: #9aa0a6;
    --border: #2a2f3a;
    --prompt: #5b8def;
    --cand: #3dd68c;
    --total: #f5a524;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    font: 14px/1.45 system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  h1 { font-size: 1.35rem; margin: 0 0 4px; }
  .meta { color: var(--muted); margin: 0 0 20px; }
  .cards { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .card {
    background: var(--panel);
    padding: 12px 16px;
    border-radius: 8px;
    min-width: 140px;
    border: 1px solid var(--border);
  }
  .card span { color: var(--muted); font-size: 12px; }
  .card b { display: block; font-size: 1.35rem; margin-top: 4px; }
  label { color: var(--muted); margin-right: 8px; }
  select {
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 16px;
    max-width: min(100%, 420px);
  }
  .chart-wrap {
    background: var(--panel);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }
  canvas { max-height: 360px; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: var(--panel);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  th, td { padding: 8px 10px; text-align: right; border-bottom: 1px solid var(--border); }
  th:first-child, td:first-child,
  th:nth-child(2), td:nth-child(2),
  th:nth-child(3), td:nth-child(3) { text-align: left; }
  th { color: var(--muted); font-weight: 600; background: #14171e; }
  tr:last-child td { border-bottom: 0; }
  .ok { color: var(--cand); }
  .fail { color: #f07178; }
</style>
</head>
<body>
<h1>Relatório de tokens — usage/</h1>
<p class="meta">Gerado em ${generatedAt} · ${rows.length} requests com usage · ${Object.keys(byRun).length} runs · fonte: usage/*.json</p>

<div class="cards" id="cards"></div>

<label for="run">Run</label>
<select id="run"></select>

<div class="chart-wrap">
  <canvas id="bars"></canvas>
</div>
<div class="chart-wrap">
  <canvas id="cumul"></canvas>
</div>
<div class="chart-wrap">
  <canvas id="chars"></canvas>
</div>

<table>
  <thead>
    <tr>
      <th>step</th>
      <th>at</th>
      <th>ação</th>
      <th>prompt</th>
      <th>candidates</th>
      <th>total</th>
      <th>promptChars</th>
      <th>ms</th>
      <th>ok</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>

<script>
const DATA = ${JSON.stringify({ rows, byRun })};
const runs = Object.keys(DATA.byRun).sort();
const sel = document.getElementById("run");
for (const r of runs) {
  const o = document.createElement("option");
  o.value = r;
  o.textContent = r + " (" + DATA.byRun[r].length + " steps)";
  sel.appendChild(o);
}
sel.value = runs[runs.length - 1] || "";

function totals(list) {
  return list.reduce((a, r) => ({
    prompt: a.prompt + r.prompt,
    candidates: a.candidates + r.candidates,
    total: a.total + r.total,
    ms: a.ms + (r.ms || 0),
  }), { prompt: 0, candidates: 0, total: 0, ms: 0 });
}

function fmt(n) {
  return Number(n).toLocaleString("pt-BR");
}

let chartBars, chartCum, chartChars;

function render() {
  const list = (DATA.byRun[sel.value] || []).slice().sort((a, b) => a.step - b.step);
  const t = totals(list);
  const all = totals(DATA.rows);
  const peak = list.reduce((m, r) => Math.max(m, r.prompt), 0);
  document.getElementById("cards").innerHTML = \`
    <div class="card"><span>Steps nesta run</span><b>\${list.length}</b></div>
    <div class="card"><span>Prompt tokens (run)</span><b>\${fmt(t.prompt)}</b></div>
    <div class="card"><span>Candidates (run)</span><b>\${fmt(t.candidates)}</b></div>
    <div class="card"><span>Total (run)</span><b>\${fmt(t.total)}</b></div>
    <div class="card"><span>Pico prompt/step</span><b>\${fmt(peak)}</b></div>
    <div class="card"><span>Total (todos os runs)</span><b>\${fmt(all.total)}</b></div>
  \`;

  const labels = list.map((r) => "s" + r.step);
  const cum = [];
  let acc = 0;
  for (const r of list) {
    acc += r.total;
    cum.push(acc);
  }

  chartBars?.destroy();
  chartCum?.destroy();
  chartChars?.destroy();

  const axis = {
    x: { ticks: { color: "#9aa0a6" }, grid: { color: "#2a2f3a" } },
    y: { ticks: { color: "#9aa0a6" }, grid: { color: "#2a2f3a" } },
  };

  chartBars = new Chart(document.getElementById("bars"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "promptTokenCount", data: list.map((r) => r.prompt), backgroundColor: "#5b8def" },
        { label: "candidatesTokenCount", data: list.map((r) => r.candidates), backgroundColor: "#3dd68c" },
        { label: "totalTokenCount", data: list.map((r) => r.total), backgroundColor: "#f5a524" },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Tokens por step (crescimento do prompt)", color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed" } },
      },
      scales: axis,
    },
  });

  chartCum = new Chart(document.getElementById("cumul"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "total acumulado na run",
        data: cum,
        borderColor: "#f5a524",
        backgroundColor: "rgba(245,165,36,0.15)",
        tension: 0.2,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Uso acumulado (crescimento)", color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed" } },
      },
      scales: axis,
    },
  });

  chartChars = new Chart(document.getElementById("chars"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "promptChars", data: list.map((r) => r.promptChars), backgroundColor: "#8b7cf6" },
        { label: "systemChars", data: list.map((r) => r.systemChars), backgroundColor: "#6b7280" },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Tamanho do texto enviado (chars)", color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed" } },
      },
      scales: axis,
    },
  });

  document.getElementById("tbody").innerHTML = list.map((r) => \`
    <tr>
      <td>\${r.step}</td>
      <td>\${r.at}</td>
      <td>\${r.acao}</td>
      <td>\${fmt(r.prompt)}</td>
      <td>\${fmt(r.candidates)}</td>
      <td>\${fmt(r.total)}</td>
      <td>\${fmt(r.promptChars)}</td>
      <td>\${fmt(r.ms)}</td>
      <td class="\${r.ok ? "ok" : "fail"}">\${r.ok ? "ok" : "fail"}</td>
    </tr>
  \`).join("");
}

sel.onchange = render;
render();
</script>
</body>
</html>
`;

writeFileSync(out, html);
console.log("wrote", out);
console.log("rows=", rows.length, "runs=", Object.keys(byRun).length);
