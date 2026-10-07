#!/usr/bin/env node
/**
 * Relatório HTML de usage-2.0/*.json (+ legado usage/*.json).
 *
 * Uso:
 *   node scripts/build-usage-dashboard.js
 *   npm run usage:report
 *
 * Saída: usage-2.0/dashboard.html
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
const usageDirV1 = join(SRC_ROOT, "usage");
const usageDir = join(SRC_ROOT, "usage-2.0");
const out = join(usageDir, "dashboard.html");

function classifyError(err) {
  const s = String(err || "");
  if (!s) return "";
  if (/429|rate limit/i.test(s)) return "429 rate limit";
  if (/503|high demand|overloaded/i.test(s)) return "503 high demand";
  if (/timeout/i.test(s)) return "timeout";
  if (/no credits remaining/i.test(s)) return "sem créditos";
  if (/temperature/i.test(s)) return "temperature inválido";
  if (/not found for API|is not found/i.test(s)) return "modelo 404";
  if (/Internal error/i.test(s)) return "erro interno API";
  if (/AGENT_BAD_ACTION/i.test(s)) return "ação inválida";
  if (/device.*not found/i.test(s)) return "device offline";
  return "outro";
}

function providerOf(model) {
  const m = String(model || "");
  if (/^gpt-|openai/i.test(m)) return "openai";
  if (/gemini/i.test(m)) return "gemini";
  return "outro";
}

function isUsageV2(j) {
  return j && typeof j === "object" && "entrada" in j && "resposta" in j && !("run" in j);
}

function textFromEntrada(entrada) {
  if (!entrada || typeof entrada !== "object") return "";
  if (Array.isArray(entrada.messages)) {
    return entrada.messages
      .map((m) => {
        if (typeof m?.content === "string") return m.content;
        if (Array.isArray(m?.content)) {
          return m.content.map((p) => p?.text || "").join("\n");
        }
        return "";
      })
      .join("\n");
  }
  const parts = [];
  for (const p of entrada.systemInstruction?.parts || []) {
    if (p?.text) parts.push(p.text);
  }
  for (const c of entrada.contents || []) {
    for (const p of c?.parts || []) {
      if (p?.text) parts.push(p.text);
    }
  }
  return parts.join("\n");
}

function textFromResposta(resposta) {
  if (!resposta || typeof resposta !== "object") return "";
  const gemini = (resposta.candidates?.[0]?.content?.parts || [])
    .map((p) => p?.text || "")
    .filter(Boolean)
    .join("");
  if (gemini) return gemini;
  return String(resposta.choices?.[0]?.message?.content || "");
}

function usageFromResposta(resposta) {
  if (!resposta || typeof resposta !== "object") return {};
  return resposta.usageMetadata || resposta.usage || {};
}

function modelFromV2(j) {
  return (
    j.entrada?.model ||
    j.resposta?.model ||
    j.resposta?.modelVersion ||
    "—"
  );
}

function errorFromV2(j) {
  const r = j.resposta;
  if (r == null) return "sem resposta";
  if (typeof r.error === "string") return r.error;
  if (r.error?.message) return String(r.error.message);
  return "";
}

function acaoFromText(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed.acao?.type ?? (typeof parsed.acao === "string" ? parsed.acao : "—");
  } catch {
    return "—";
  }
}

function parseHistoryMeta(j) {
  const text = String(
    j.prompt || j.input?.prompt || (isUsageV2(j) ? textFromEntrada(j.entrada) : ""),
  );
  const m = text.match(/Histórico recente \(últimos (\d+)\/(\d+)\)/);
  const fromPrompt = m
    ? { historyCount: Number(m[1]), historySteps: Number(m[2]) }
    : null;
  const count = Number(j.historyCount);
  const steps = Number(j.historySteps);
  if (j.historyCount != null && Number.isFinite(count) && count >= 0) {
    return {
      historyCount: count,
      historySteps: Number.isFinite(steps) && steps >= 0 ? steps : (fromPrompt?.historySteps ?? count),
    };
  }
  if (fromPrompt) return fromPrompt;
  return {
    historyCount: 0,
    historySteps: Number.isFinite(steps) && steps >= 0 ? steps : 0,
  };
}

function dayOf(at, file) {
  const s = String(at || file || "");
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

function listJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: f, path: join(dir, f) }));
}

function rowFromFile({ file, path }) {
  const j = JSON.parse(readFileSync(path, "utf8"));
  if (isUsageV2(j)) {
    const u = usageFromResposta(j.resposta);
    const err = errorFromV2(j);
    const prompt = Number(u.promptTokenCount ?? u.prompt_tokens ?? 0) || 0;
    const candidates =
      Number(u.candidatesTokenCount ?? u.completion_tokens ?? 0) || 0;
    const total =
      Number(u.totalTokenCount ?? u.total_tokens ?? prompt + candidates) || 0;
    const cached = Number(u.prompt_tokens_details?.cached_tokens ?? 0) || 0;
    const thoughts = Number(u.thoughtsTokenCount ?? 0) || 0;
    const model = modelFromV2(j);
    const entradaText = textFromEntrada(j.entrada);
    const respostaText = textFromResposta(j.resposta);
    return {
      file,
      run: "—",
      step: 0,
      at: file,
      day: dayOf(null, file),
      model,
      provider: providerOf(model),
      engine: "—",
      ok: j.resposta != null && !err,
      ms: 0,
      promptChars: entradaText.length,
      systemChars: 0,
      ...parseHistoryMeta(j),
      prompt,
      candidates,
      total,
      cached,
      thoughts,
      acao: acaoFromText(respostaText),
      error: err.slice(0, 160),
      errorKind: classifyError(err),
    };
  }
  const u = j.usage || j.output?.raw?.usage || j.output?.raw?.usageMetadata || {};
  const err =
    typeof j.error === "string"
      ? j.error
      : j.error
        ? JSON.stringify(j.error)
        : "";
  const prompt = Number(u.promptTokenCount ?? u.prompt_tokens ?? 0) || 0;
  const candidates =
    Number(u.candidatesTokenCount ?? u.completion_tokens ?? 0) || 0;
  const total =
    Number(u.totalTokenCount ?? u.total_tokens ?? prompt + candidates) || 0;
  const cached = Number(u.prompt_tokens_details?.cached_tokens ?? 0) || 0;
  const thoughts = Number(u.thoughtsTokenCount ?? 0) || 0;
  const model = j.model ?? "—";
  return {
    file,
    run: j.run ?? "—",
    step: j.step ?? 0,
    at: j.at ?? file,
    day: dayOf(j.at, file),
    model,
    provider: providerOf(model),
    engine: j.engine ?? "—",
    ok: j.ok !== false && !err,
    ms: Number(j.ms) || 0,
    promptChars: j.promptChars ?? 0,
    systemChars: j.systemChars ?? 0,
    ...parseHistoryMeta(j),
    prompt,
    candidates,
    total,
    cached,
    thoughts,
    acao: j.acao?.type ?? (typeof j.acao === "string" ? j.acao : "—"),
    error: err.slice(0, 160),
    errorKind: classifyError(err),
  };
}

const rows = [...listJson(usageDir), ...listJson(usageDirV1)]
  .map(rowFromFile)
  .sort((a, b) => String(a.at).localeCompare(String(b.at)));

const byRun = {};
for (const r of rows) {
  (byRun[r.run] ??= []).push(r);
}

const withTokens = rows.filter((r) => r.total > 0).length;
const generatedAt = new Date().toISOString();

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Relatório usage — screen-robot</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  :root {
    --bg: #0f1115;
    --panel: #1a1d24;
    --text: #e8eaed;
    --muted: #9aa0a6;
    --border: #2a2f3a;
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
  h2 { font-size: 1rem; margin: 0 0 12px; font-weight: 600; }
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
  .card b { display: block; font-size: 1.25rem; margin-top: 4px; }
  label { color: var(--muted); margin-right: 8px; }
  select {
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 16px;
    max-width: min(100%, 520px);
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  .chart-wrap {
    background: var(--panel);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }
  canvas { max-height: 320px; }
  .insights {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 20px;
  }
  .insights li { margin: 6px 0; }
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: var(--panel);
  }
  th, td { padding: 8px 10px; text-align: right; border-bottom: 1px solid var(--border); white-space: nowrap; }
  th:nth-child(-n+7), td:nth-child(-n+7) { text-align: left; }
  th { color: var(--muted); font-weight: 600; background: #14171e; position: sticky; top: 0; }
  tr:last-child td { border-bottom: 0; }
  tr.total td { font-weight: 700; background: #14171e; border-top: 1px solid var(--border); }
  .ok { color: #3dd68c; }
  .fail { color: #f07178; }
  .err { color: #f07178; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
</style>
</head>
<body>
<h1>Relatório de usage — screen-robot</h1>
<p class="meta">Gerado em ${generatedAt} · ${rows.length} requests · ${withTokens} com tokens · ${Object.keys(byRun).length} runs · fonte: usage-2.0/*.json + usage/*.json</p>

<div class="insights">
  <h2>Insights</h2>
  <ul id="insights"></ul>
</div>

<div class="cards" id="cards"></div>

<label for="run">Filtro</label>
<select id="run"></select>

<div class="grid">
  <div class="chart-wrap"><canvas id="cModelsReq"></canvas></div>
  <div class="chart-wrap"><canvas id="cModelsTok"></canvas></div>
  <div class="chart-wrap"><canvas id="cErrors"></canvas></div>
  <div class="chart-wrap"><canvas id="cAcoes"></canvas></div>
  <div class="chart-wrap"><canvas id="cEngines"></canvas></div>
  <div class="chart-wrap"><canvas id="cDays"></canvas></div>
  <div class="chart-wrap"><canvas id="cLatency"></canvas></div>
  <div class="chart-wrap"><canvas id="cProvider"></canvas></div>
  <div class="chart-wrap"><canvas id="cCost"></canvas></div>
</div>

<p class="meta" id="priceNote"></p>
<div class="table-wrap" style="margin-bottom:16px">
<table>
  <thead>
    <tr>
      <th>modelo</th>
      <th>in / 1M</th>
      <th>out / 1M</th>
      <th>req</th>
      <th>prompt tok</th>
      <th>out+think</th>
      <th>gasto até agora</th>
      <th>% gasto</th>
      <th>por req</th>
      <th>ritmo / 30d</th>
    </tr>
  </thead>
  <tbody id="costBody"></tbody>
</table>
</div>

<div class="chart-wrap"><canvas id="bars"></canvas></div>
<div class="chart-wrap"><canvas id="histTok"></canvas></div>
<div class="chart-wrap"><canvas id="histAvg"></canvas></div>
<div class="chart-wrap"><canvas id="cumul"></canvas></div>
<div class="chart-wrap"><canvas id="chars"></canvas></div>

<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>arquivo</th>
      <th>run</th>
      <th>modelo</th>
      <th>engine</th>
      <th>ação</th>
      <th>hist</th>
      <th>prompt</th>
      <th>out</th>
      <th>total</th>
      <th>ms</th>
      <th>ok</th>
      <th>erro</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>
</div>

<script>
const DATA = ${JSON.stringify({ rows, byRun })};
const ALL = "__all__";
const PALETTE = ["#5b8def","#3dd68c","#f5a524","#f07178","#8b7cf6","#22d3ee","#fb7185","#a3e635","#fbbf24","#64748b","#2dd4bf"];
/** Paid tier US$ / 1M tokens — Gemini 2026-10-06 (ai.google.dev/gemini-api/docs/pricing) · OpenAI developers.openai.com/api/docs */
const USD_PER_M = {
  "gpt-4o-mini": { in: 0.15, out: 0.60 },
  "gpt-4.1-mini": { in: 0.40, out: 1.60 },
  "gpt-5": { in: 1.25, out: 10 },
  "gpt-5-mini": { in: 0.25, out: 2.00 },
  "gemini-3.5-flash-lite": { in: 0.30, out: 2.50 },
  "gemini-3.1-flash-lite": { in: 0.25, out: 1.50 },
  "gemini-3.5-flash": { in: 1.50, out: 9.00 },
  "gemini-3.6-flash": { in: 0.75, out: 3.75 },
  "gemini-3.7-flash": { in: 0.75, out: 3.75 },
  "gemini-3.8-flash": { in: 0.75, out: 3.75 },
  "gemini-3-flash": { in: 0.50, out: 3.00 },
  "gemini-3-flash-preview": { in: 0.50, out: 3.00 },
  "gemini-2.5-flash": { in: 0.30, out: 2.50 },
};
const PRICE_NOTE = "Custo = paid tier oficial (não free) · US$ 1 = R$ 5,50. Out Gemini inclui thinking. 3.6/3.7/3.8 Flash = introdutório até 31/12/2026 (depois in 1.50 / out 7.50). Fontes: Gemini API pricing · OpenAI API pricing. Consulta 2026-10-06.";

const runs = Object.keys(DATA.byRun).sort();
const sel = document.getElementById("run");
{
  const o = document.createElement("option");
  o.value = ALL;
  o.textContent = "Todos os arquivos (" + DATA.rows.length + ")";
  sel.appendChild(o);
}
for (const r of runs) {
  const o = document.createElement("option");
  o.value = r;
  o.textContent = r + " (" + DATA.byRun[r].length + ")";
  sel.appendChild(o);
}
sel.value = ALL;

function fmt(n) { return Number(n).toLocaleString("pt-BR"); }
function usd(n) {
  const v = Number(n) || 0;
  if (v === 0) return "US$ 0";
  if (Math.abs(v) < 0.01) return "US$ " + v.toFixed(4);
  return "US$ " + v.toFixed(2);
}
const BRL_PER_USD = 5.50;
function brl(nUsd) {
  const v = (Number(nUsd) || 0) * BRL_PER_USD;
  if (v === 0) return "R$ 0";
  const digits = Math.abs(v) < 0.01 ? 4 : 2;
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function money(nUsd) { return usd(nUsd) + " · " + brl(nUsd); }
function outTokens(r) { return (r.candidates || 0) + (r.thoughts || 0); }
function rowUsd(r) {
  const p = USD_PER_M[r.model];
  if (!p) return 0;
  return (r.prompt / 1e6) * p.in + (outTokens(r) / 1e6) * p.out;
}

function countBy(list, key) {
  const m = {};
  for (const r of list) {
    const k = r[key] || "—";
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

function sumBy(list, key, field) {
  const m = {};
  for (const r of list) {
    const k = r[key] || "—";
    m[k] = (m[k] || 0) + (r[field] || 0);
  }
  return m;
}

function estimateUsd(list) {
  return list.reduce((s, r) => s + rowUsd(r), 0);
}

function costByModel(list) {
  const m = {};
  for (const r of list) {
    const k = r.model || "—";
    (m[k] ??= { model: k, n: 0, prompt: 0, out: 0, usd: 0 });
    m[k].n += 1;
    m[k].prompt += r.prompt || 0;
    m[k].out += outTokens(r);
    m[k].usd += rowUsd(r);
  }
  return Object.values(m).sort((a, b) => b.usd - a.usd);
}

function spanDays(list) {
  const days = [...new Set(list.map((r) => r.day).filter(Boolean))];
  return Math.max(days.length, 1);
}

function selectedList() {
  if (sel.value === ALL) return DATA.rows.slice();
  return (DATA.byRun[sel.value] || []).slice().sort((a, b) => a.step - b.step);
}

function insights(list) {
  const n = list.length;
  if (!n) return ["Sem requests neste filtro."];
  const fail = list.filter((r) => !r.ok).length;
  const models = countBy(list, "model");
  const topModel = Object.entries(models).sort((a, b) => b[1] - a[1])[0];
  const tokM = sumBy(list, "model", "total");
  const topTok = Object.entries(tokM).sort((a, b) => b[1] - a[1])[0];
  const errK = countBy(list.filter((r) => r.errorKind), "errorKind");
  const topErr = Object.entries(errK).sort((a, b) => b[1] - a[1])[0];
  const acoes = countBy(list, "acao");
  const topAcao = Object.entries(acoes).filter((x) => x[0] !== "—").sort((a, b) => b[1] - a[1])[0];
  const engines = countBy(list, "engine");
  const topEng = Object.entries(engines).sort((a, b) => b[1] - a[1])[0];
  const withMs = list.filter((r) => r.ms > 0);
  const avgMs = withMs.length
    ? Math.round(withMs.reduce((s, r) => s + r.ms, 0) / withMs.length)
    : 0;
  const latM = {};
  for (const r of list) {
    if (!r.ms) continue;
    (latM[r.model] ??= { s: 0, n: 0 });
    latM[r.model].s += r.ms;
    latM[r.model].n += 1;
  }
  const slow = Object.entries(latM)
    .map(([k, v]) => [k, Math.round(v.s / v.n)])
    .sort((a, b) => b[1] - a[1])[0];
  const s503 = list.filter((r) => r.errorKind === "503 high demand").length;
  const s429 = list.filter((r) => r.errorKind === "429 rate limit").length;
  const done = (acoes.done || 0);
  const byH = {};
  for (const r of list) {
    (byH[r.historyCount] ??= { n: 0, prompt: 0 });
    byH[r.historyCount].n += 1;
    byH[r.historyCount].prompt += r.prompt || 0;
  }
  const histKeys = Object.keys(byH).map(Number).sort((a, b) => a - b);
  const maxH = histKeys.length ? histKeys[histKeys.length - 1] : 0;
  const avg0 = byH[0]?.n ? Math.round(byH[0].prompt / byH[0].n) : null;
  const avgMax = byH[maxH]?.n ? Math.round(byH[maxH].prompt / byH[maxH].n) : null;
  const out = [
    topModel && "Modelo mais usado: " + topModel[0] + " (" + fmt(topModel[1]) + " req, " + Math.round(100 * topModel[1] / n) + "%).",
    topTok && "Mais tokens: " + topTok[0] + " (" + fmt(topTok[1]) + ").",
    "Histórico no prompt: máx " + maxH + " passos (janela típica " + (list[0] && list.reduce((m, r) => Math.max(m, r.historySteps || 0), 0)) + ").",
    avg0 != null && avgMax != null && maxH > 0
      ? "Prompt tokens médios: hist 0 = " + fmt(avg0) + " → hist " + maxH + " = " + fmt(avgMax) + " (" + (avgMax >= avg0 ? "+" : "") + fmt(avgMax - avg0) + ")."
      : null,
    "Taxa de falha HTTP/decide: " + Math.round(100 * fail / n) + "% (" + fail + "/" + n + ").",
    s503 ? "503/high demand: " + s503 + " (" + Math.round(100 * s503 / n) + "% das req)." : null,
    s429 ? "429 rate limit: " + s429 + "." : null,
    topErr && "Erro dominante: " + topErr[0] + " (" + topErr[1] + ").",
    topAcao && "Ação mais frequente: " + topAcao[0] + " (" + topAcao[1] + ").",
    topEng && "OCR engine: " + topEng[0] + " (" + topEng[1] + " req).",
    avgMs ? "Latência média da API: " + fmt(avgMs) + " ms." : null,
    slow && "Modelo mais lento (média): " + slow[0] + " (" + fmt(slow[1]) + " ms).",
    done ? "done nesta janela: " + done + "." : "Nenhum done neste filtro.",
    "Custo pago estimado até agora: " + money(estimateUsd(list)) + " (" + spanDays(list) + " dia(s) com usage → ritmo ~" + money(estimateUsd(list) / spanDays(list) * 30) + "/30d).",
    ...costByModel(list).filter((x) => x.usd > 0).slice(0, 6).map((x) =>
      x.model + ": " + money(x.usd) + " (" + fmt(x.n) + " req)."
    ),
  ];
  return out.filter(Boolean);
}

function doughnut(id, title, map) {
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  return new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: labels.map((k) => map[k]),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: title, color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed", boxWidth: 12 }, position: "right" },
      },
    },
  });
}

function barH(id, title, map, label) {
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data: labels.map((k) => map[k]),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
      }],
    },
    options: {
      indexAxis: "y",
      plugins: {
        title: { display: true, text: title, color: "#e8eaed" },
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: "#9aa0a6" }, grid: { color: "#2a2f3a" } },
        y: { ticks: { color: "#9aa0a6" }, grid: { display: false } },
      },
    },
  });
}

const charts = {};
function kill() {
  for (const k of Object.keys(charts)) {
    charts[k]?.destroy();
    charts[k] = null;
  }
}

function render() {
  const list = selectedList();
  const tPrompt = list.reduce((s, r) => s + r.prompt, 0);
  const tOut = list.reduce((s, r) => s + r.candidates, 0);
  const tTot = list.reduce((s, r) => s + r.total, 0);
  const ok = list.filter((r) => r.ok).length;
  const fail = list.length - ok;
  const withMs = list.filter((r) => r.ms > 0);
  const avgMs = withMs.length
    ? Math.round(withMs.reduce((s, r) => s + r.ms, 0) / withMs.length)
    : 0;
  const modelsN = Object.keys(countBy(list, "model")).length;

  const maxH = list.reduce((m, r) => Math.max(m, r.historyCount || 0), 0);
  const maxWin = list.reduce((m, r) => Math.max(m, r.historySteps || 0), 0);

  document.getElementById("insights").innerHTML = insights(list)
    .map((t) => "<li>" + t + "</li>").join("");

  document.getElementById("cards").innerHTML = \`
    <div class="card"><span>Requests</span><b>\${fmt(list.length)}</b></div>
    <div class="card"><span>ok / fail</span><b>\${ok} / \${fail}</b></div>
    <div class="card"><span>Modelos</span><b>\${modelsN}</b></div>
    <div class="card"><span>Prompt tokens</span><b>\${fmt(tPrompt)}</b></div>
    <div class="card"><span>Output tokens</span><b>\${fmt(tOut)}</b></div>
    <div class="card"><span>Total tokens</span><b>\${fmt(tTot)}</b></div>
    <div class="card"><span>Hist. no prompt</span><b>\${fmt(maxH)} / \${fmt(maxWin)}</b></div>
    <div class="card"><span>Latência média</span><b>\${fmt(avgMs)} ms</b></div>
    <div class="card"><span>Custo até agora</span><b>\${money(estimateUsd(list))}</b></div>
    <div class="card"><span>Ritmo / 30d</span><b>\${money(estimateUsd(list) / spanDays(list) * 30)}</b></div>
  \`;

  document.getElementById("priceNote").textContent = PRICE_NOTE;
  const costs = costByModel(list);
  const totUsd = estimateUsd(list);
  const days = spanDays(list);
  const totN = costs.reduce((s, x) => s + x.n, 0);
  const totPrompt = costs.reduce((s, x) => s + x.prompt, 0);
  const totOutTok = costs.reduce((s, x) => s + x.out, 0);
  const rowsHtml = costs.map((x) => {
    const rate = USD_PER_M[x.model];
    const pct = totUsd > 0 ? (100 * x.usd / totUsd).toFixed(1) + "%" : "—";
    const per = x.n ? money(x.usd / x.n) : "—";
    const month = money(x.usd / days * 30);
    return "<tr><td>" + x.model + "</td><td>" + (rate ? money(rate.in) : "—") + "</td><td>" + (rate ? money(rate.out) : "—") + "</td><td>" + fmt(x.n) + "</td><td>" + fmt(x.prompt) + "</td><td>" + fmt(x.out) + "</td><td>" + money(x.usd) + "</td><td>" + pct + "</td><td>" + per + "</td><td>" + month + "</td></tr>";
  }).join("");
  // aspas simples no HTML: o JS do relatório vive num template literal do Node; \" vira " e quebra o script
  const totalRow = "<tr class='total'><td>Total</td><td>—</td><td>—</td><td>" + fmt(totN) + "</td><td>" + fmt(totPrompt) + "</td><td>" + fmt(totOutTok) + "</td><td>" + money(totUsd) + "</td><td>100%</td><td>" + (totN ? money(totUsd / totN) : "—") + "</td><td>" + money(totUsd / days * 30) + "</td></tr>";
  document.getElementById("costBody").innerHTML = rowsHtml + totalRow;

  kill();
  charts.cModelsReq = doughnut("cModelsReq", "Requests por modelo", countBy(list, "model"));
  charts.cModelsTok = barH("cModelsTok", "Tokens totais por modelo", sumBy(list, "model", "total"), "tokens");
  const errMap = countBy(list.filter((r) => r.errorKind), "errorKind");
  charts.cErrors = doughnut(
    "cErrors",
    "Falhas por tipo",
    Object.keys(errMap).length ? errMap : { "sem falhas": 0 },
  );
  charts.cAcoes = doughnut("cAcoes", "Ações decide", countBy(list, "acao"));
  charts.cEngines = doughnut("cEngines", "OCR engine", countBy(list, "engine"));
  charts.cDays = barH("cDays", "Requests por dia", countBy(list, "day"), "req");
  const lat = {};
  for (const r of list) {
    if (!r.ms) continue;
    (lat[r.model] ??= { s: 0, n: 0 });
    lat[r.model].s += r.ms;
    lat[r.model].n += 1;
  }
  const latAvg = {};
  for (const [k, v] of Object.entries(lat)) latAvg[k] = Math.round(v.s / v.n);
  charts.cLatency = barH("cLatency", "Latência média da API por modelo (ms)", latAvg, "ms");
  charts.cProvider = doughnut("cProvider", "Requests por provider", countBy(list, "provider"));
  const costMap = {};
  for (const x of costs) costMap[x.model] = Number(x.usd.toFixed(6));
  charts.cCost = barH("cCost", "US$ gasto até agora por modelo (paid tier)", costMap, "US$");

  const labels = list.map((r, i) =>
    sel.value === ALL ? String(i + 1) : "s" + r.step
  );
  const cum = [];
  let acc = 0;
  for (const r of list) { acc += r.total; cum.push(acc); }
  const axis = {
    x: { ticks: { color: "#9aa0a6", maxTicksLimit: 40 }, grid: { color: "#2a2f3a" } },
    y: { ticks: { color: "#9aa0a6" }, grid: { color: "#2a2f3a" } },
  };
  const pt = list.length > 80 ? 0 : 2;

  charts.bars = new Chart(document.getElementById("bars"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "prompt tokens", data: list.map((r) => r.prompt), backgroundColor: "#5b8def" },
        { label: "output tokens", data: list.map((r) => r.candidates), backgroundColor: "#3dd68c" },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Tokens por request", color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed" } },
      },
      scales: axis,
    },
  });
  const histAvgMap = {};
  for (const r of list) {
    (histAvgMap[r.historyCount] ??= { s: 0, n: 0 });
    histAvgMap[r.historyCount].s += r.prompt || 0;
    histAvgMap[r.historyCount].n += 1;
  }
  const histLabels = Object.keys(histAvgMap).map(Number).sort((a, b) => a - b);
  const histAvgTok = {};
  for (const k of histLabels) histAvgTok[String(k)] = Math.round(histAvgMap[k].s / histAvgMap[k].n);
  charts.histTok = new Chart(document.getElementById("histTok"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "prompt tokens",
          data: list.map((r) => r.prompt),
          borderColor: "#5b8def",
          yAxisID: "y",
          tension: 0.15,
          pointRadius: pt,
        },
        {
          label: "historyCount",
          data: list.map((r) => r.historyCount),
          borderColor: "#fb7185",
          yAxisID: "y2",
          tension: 0.15,
          pointRadius: pt,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Prompt tokens vs historyCount", color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed" } },
      },
      scales: {
        x: axis.x,
        y: { ...axis.y, title: { display: true, text: "prompt tokens", color: "#9aa0a6" } },
        y2: {
          position: "right",
          ticks: { color: "#9aa0a6" },
          grid: { display: false },
          title: { display: true, text: "historyCount", color: "#9aa0a6" },
        },
      },
    },
  });
  charts.histAvg = new Chart(document.getElementById("histAvg"), {
    type: "bar",
    data: {
      labels: histLabels.map(String),
      datasets: [{
        label: "prompt tokens médios",
        data: histLabels.map((k) => histAvgTok[String(k)]),
        backgroundColor: "#fb7185",
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Prompt tokens médios por historyCount", color: "#e8eaed" },
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: "#9aa0a6" }, grid: { display: false }, title: { display: true, text: "historyCount", color: "#9aa0a6" } },
        y: { ticks: { color: "#9aa0a6" }, grid: { color: "#2a2f3a" } },
      },
    },
  });
  charts.cumul = new Chart(document.getElementById("cumul"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "tokens acumulados",
        data: cum,
        borderColor: "#f5a524",
        backgroundColor: "rgba(245,165,36,0.15)",
        tension: 0.15,
        fill: true,
        pointRadius: pt,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Tokens acumulados", color: "#e8eaed" },
        legend: { labels: { color: "#e8eaed" } },
      },
      scales: axis,
    },
  });
  charts.chars = new Chart(document.getElementById("chars"), {
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

  const tableLogs = list.slice().sort((a, b) =>
    String(b.at).localeCompare(String(a.at)) || String(b.file).localeCompare(String(a.file))
  );
  document.getElementById("tbody").innerHTML = tableLogs.map((r, i) => \`
    <tr>
      <td>\${i + 1}</td>
      <td title="\${r.file}">\${r.file}</td>
      <td title="\${r.run}">\${r.run}</td>
      <td>\${r.model}</td>
      <td>\${r.engine}</td>
      <td>\${r.acao}</td>
      <td>\${r.historyCount}/\${r.historySteps}</td>
      <td>\${fmt(r.prompt)}</td>
      <td>\${fmt(r.candidates)}</td>
      <td>\${fmt(r.total)}</td>
      <td>\${fmt(r.ms)}</td>
      <td class="\${r.ok ? "ok" : "fail"}">\${r.ok ? "ok" : "fail"}</td>
      <td class="err" title="\${(r.error || "").replace(/"/g, "&quot;")}">\${r.errorKind || r.error || ""}</td>
    </tr>
  \`).join("");
}

sel.onchange = render;
render();
</script>
</body>
</html>
`;

if (!existsSync(usageDir)) mkdirSync(usageDir, { recursive: true });
writeFileSync(out, html);
console.log("wrote", out);
console.log("files=", rows.length, "withTokens=", withTokens, "runs=", Object.keys(byRun).length);
