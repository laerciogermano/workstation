import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BrandBar } from './brand.jsx';
import { ChartPanel, ChartTooltip, useChartTheme } from './chart-kit.jsx';
import FUNIL from './data/funil.json';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const SEM_VENDEDOR = '(sem vendedor)';

// Paleta categórica validada (dataviz): cor segue o vendedor, nunca o rank.
const SERIES = {
  noite: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  dia: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
};
const NEUTRO = '#8C95A8';

// Funil mensal: etapas por medida — [campo, rótulo, slot da paleta].
const FUNIL_MEDIDAS = {
  qtd: {
    label: 'Quantidade',
    etapas: [
      ['orc_qtd', 'Orçamentos', 0],
      ['orc_aprov', 'Aprovados', 2],
      ['ped_qtd', 'Pedidos', 1],
    ],
    format: (v) => int.format(v),
    full: (v) => int.format(v),
    width: 40,
  },
  valor: {
    label: 'Valor (R$)',
    etapas: [
      ['orc_aprov_valor', 'Valor aprovado', 2],
      ['ped_valor', 'Valor em pedidos', 1],
      ['fat_valor', 'Faturamento', 0],
    ],
    format: (v) => money(v),
    full: (v) => brl.format(v),
    width: 84,
  },
};

// Cor fixa por vendedor (slot da paleta), independente de rank, filtro ou regeração do JSON.
// Vendedor novo: atribuir o próximo slot livre (6, 7); sem slot → cinza neutro.
const COR_VENDEDOR = {
  Olívia: 0, // azul
  Guilherme: 1, // laranja
  Marcello: 2, // verde-água
  Gabriele: 3, // amarelo
  Erickson: 4, // magenta
  'Bruno Toyo': 5, // verde
};

const METRICAS = [
  { value: 'fat_valor', label: 'Faturamento', format: (v) => money(v), full: (v) => brl.format(v) },
  { value: 'ped_valor', label: 'Valor em pedidos', format: (v) => money(v), full: (v) => brl.format(v) },
  { value: 'ped_qtd', label: 'Pedidos (qtd)', format: (v) => int.format(v), full: (v) => int.format(v) },
  { value: 'orc_qtd', label: 'Orçamentos (qtd)', format: (v) => int.format(v), full: (v) => int.format(v) },
];

const METRICAS_SAZONAL = [
  METRICAS[0],
  METRICAS[1],
  { value: 'orc_aprov_valor', label: 'Valor aprovado', format: (v) => money(v), full: (v) => brl.format(v) },
  METRICAS[2],
  { value: 'orc_aprov', label: 'Aprovados (qtd)', format: (v) => int.format(v), full: (v) => int.format(v) },
  METRICAS[3],
];

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const int = new Intl.NumberFormat('pt-BR');

function money(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  if (a >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return brl.format(v);
}

function pct(v, digits = 0) {
  if (!Number.isFinite(v)) return '—';
  return `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`;
}

function mesLabel(key, withYear = true) {
  const [y, m] = key.split('-');
  return withYear ? `${MESES[Number(m) - 1]}/${y.slice(2)}` : MESES[Number(m) - 1];
}

function median(xs) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

const ZERO = {
  orc_qtd: 0,
  orc_aprov: 0,
  orc_perdido: 0,
  orc_valor: 0,
  orc_aprov_valor: 0,
  ped_qtd: 0,
  ped_valor: 0,
  fat_valor: 0,
};

function sum(rows) {
  const t = { ...ZERO };
  for (const r of rows) for (const k in ZERO) t[k] += r[k];
  return t;
}

function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

/** Meses do filtro e o mesmo recorte no ano anterior (para Δ). */
function periodMonths(ano, mes) {
  const inPeriod = (k) => (ano === 'todos' || k.startsWith(ano)) && (mes === 'todos' || k.endsWith(`-${mes}`));
  const atual = FUNIL.meses.filter(inPeriod);
  if (ano === 'todos') return { atual, anterior: [] };
  const prevYear = String(Number(ano) - 1);
  // Compara só meses que existem nos dois anos (ex.: Jan–Out).
  const anterior = atual
    .map((k) => `${prevYear}${k.slice(4)}`)
    .filter((k) => FUNIL.meses.includes(k));
  const comparable = new Set(anterior.map((k) => k.slice(5)));
  return { atual, anterior, atualComparavel: atual.filter((k) => comparable.has(k.slice(5))) };
}

function Delta({ cur, prev, invert = false }) {
  if (!prev) return null;
  const d = cur / prev - 1;
  if (!Number.isFinite(d)) return null;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={`delta ${good ? 'delta-up' : 'delta-down'}`}>
      {d > 0 ? '▲' : '▼'} {pct(Math.abs(d))}
    </span>
  );
}

function Kpi({ label, value, hint, delta }) {
  return (
    <article className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {(hint || delta) && (
        <p className="kpi-hint">
          {delta} {hint}
        </p>
      )}
    </article>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="filter">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FunnelBars({ title, stages }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="funnel-col">
      <h3 className="funnel-title">{title}</h3>
      <ol className="funnel">
        {stages.map((s, i) => (
          <li key={s.label}>
            {i > 0 && s.conv != null && (
              <p className="funnel-step">
                <span aria-hidden>↓</span> {pct(s.conv)} {s.convLabel}
              </p>
            )}
            <div className="funnel-row">
              <div className="funnel-head">
                <span className="funnel-label">{s.label}</span>
                <span className="funnel-value">{s.display}</span>
              </div>
              <span className="funnel-track">
                <span
                  className="funnel-bar"
                  style={{ width: `${Math.max((s.value / max) * 100, 0.8)}%`, opacity: 1 - i * 0.2 }}
                />
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Funil mensal por vendedor: cor = vendedor, traço = etapa.
const STAGE_LINE = {
  orc: { label: 'Orçamentos', short: 'Orç.', dash: '2 4', width: 1.5 },
  apr: { label: 'Aprovados', short: 'Aprov.', dash: '7 4', width: 1.5 },
  ped: { label: 'Pedidos', short: 'Ped.', dash: undefined, width: 2.5 },
};

const STAGE_OPACITY = { orc: 0.28, apr: 0.6, ped: 1 };

/** Coluna = maior etapa escolhida; as demais desenhadas por cima, na mesma escala (eixo começa em 0). */
function FunilShape({ x, y, width, height, payload, vendedor, fill, etapas }) {
  const vals = etapas.map((k) => [k, payload[`${k}:${vendedor}`] ?? 0]);
  const top = Math.max(0, ...vals.map(([, v]) => v));
  if (!top || width <= 0) return null;
  const base = y + height;
  return (
    <g>
      {vals
        .sort((a, b) => b[1] - a[1]) // maior atrás, para nenhuma etapa sumir
        .map(([k, v]) => {
          const h = (v / top) * height;
          return v > 0 ? (
            <rect key={k} x={x} y={base - h} width={width} height={h} rx={Math.min(3, width / 2)} fill={fill} fillOpacity={STAGE_OPACITY[k]} />
          ) : null;
        })}
    </g>
  );
}

/** Botões marcáveis (multiselect); mantém a ordem de `options` e ao menos um marcado. */
function MultiChips({ label, options, value, onChange }) {
  const toggle = (k) => {
    const next = value.includes(k) ? value.filter((x) => x !== k) : [...value, k];
    if (next.length) onChange(options.map((o) => o.value).filter((x) => next.includes(x)));
  };
  return (
    <fieldset className="filter chips">
      <legend>{label}</legend>
      <div>
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={`chip${on ? ' chip-on' : ''}`}
              aria-pressed={on}
              disabled={on && value.length === 1}
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function StageChips({ value, onChange }) {
  return (
    <MultiChips
      label="Etapas"
      options={Object.entries(STAGE_LINE).map(([k, st]) => ({ value: k, label: st.label }))}
      value={value}
      onChange={onChange}
    />
  );
}

function Tabs({ value, onChange, options, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`tab${value === o.value ? ' tab-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StageSample({ k }) {
  const st = STAGE_LINE[k];
  return (
    <svg width="28" height="8" aria-hidden>
      <line x1="1" y1="4" x2="27" y2="4" stroke="currentColor" strokeWidth={st.width} strokeDasharray={st.dash} />
    </svg>
  );
}

function FunilTooltip({ active, payload, label, sellers, colorOf, etapas = Object.keys(STAGE_LINE) }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const colunas = etapas;
  const unica = etapas.length === 1 ? etapas[0] : null;
  const conv = etapas.includes('orc') && etapas.includes('ped');
  const linhas = sellers
    .filter((v) => colunas.some((k) => row[`${k}:${v}`]))
    .sort((a, b) => (unica ? (row[`${unica}:${b}`] ?? 0) - (row[`${unica}:${a}`] ?? 0) : 0));
  if (!linhas.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <table className="tooltip-table">
        <thead>
          <tr>
            <th />
            {colunas.map((k) => (
              <th key={k}>{STAGE_LINE[k].short}</th>
            ))}
            {conv && <th>Conv.</th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map((v) => {
            const o = row[`orc:${v}`] ?? 0;
            const pd = row[`ped:${v}`] ?? 0;
            return (
              <tr key={v}>
                <td>
                  <i className="swatch" style={{ background: colorOf(v) }} />
                  {v}
                </td>
                {colunas.map((k) => (
                  <td key={k}>{int.format(row[`${k}:${v}`] ?? 0)}</td>
                ))}
                {conv && <td>{o ? pct(pd / o) : '—'}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Executivo({
  onGoHome,
  onNavigate,
  theme,
  onToggleTheme,
}) {
  const chartTheme = useChartTheme();
  const anos = [...new Set(FUNIL.meses.map((k) => k.slice(0, 4)))];
  const ultimoMes = FUNIL.meses[FUNIL.meses.length - 1];
  const [ano, setAno] = useState(ultimoMes.slice(0, 4));
  const [mes, setMes] = useState('todos');
  const [vendedor, setVendedor] = useState('todos');
  const [metrica, setMetrica] = useState('fat_valor');
  const [funilModo, setFunilModo] = useState('linhas');
  const [funilTotalModo, setFunilTotalModo] = useState('barras');
  const [funilMedida, setFunilMedida] = useState('qtd');
  const [sazMetricas, setSazMetricas] = useState(['fat_valor']);
  const [etapasFunil, setEtapasFunil] = useState(Object.keys(STAGE_LINE));

  const palette = SERIES[theme] ?? SERIES.noite;
  const colorOf = (v) => {
    const i = COR_VENDEDOR[v];
    return i == null ? NEUTRO : palette[i];
  };

  const view = useMemo(() => {
    const { atual, anterior, atualComparavel } = periodMonths(ano, mes);
    const bySeller = (r) => vendedor === 'todos' || r.vendedor === vendedor;
    const rowsIn = (months) => {
      const set = new Set(months);
      return FUNIL.rows.filter((r) => set.has(r.mes) && bySeller(r));
    };
    const cur = sum(rowsIn(atual));
    const prev = anterior.length ? sum(rowsIn(anterior)) : null;
    const curCmp = atualComparavel?.length ? sum(rowsIn(atualComparavel)) : null;

    // Por vendedor (sempre todos, para ranking/share).
    const set = new Set(atual);
    const periodRows = FUNIL.rows.filter((r) => set.has(r.mes));
    const leadSet = FUNIL.leadTime.filter((l) => set.has(l.mes));
    const sellers = [...groupBy(periodRows, 'vendedor')]
      .map(([v, rs]) => {
        const t = sum(rs);
        const lead = leadSet.filter((l) => l.vendedor === v).map((l) => l.dias);
        return { vendedor: v, ...t, lead: median(lead) };
      })
      .filter((s) => s.orc_qtd || s.ped_qtd || s.fat_valor);
    const fatTotal = sellers.reduce((a, s) => a + s.fat_valor, 0);
    for (const s of sellers) s.share = fatTotal ? s.fat_valor / fatTotal : 0;
    sellers.sort((a, b) => b.fat_valor - a.fat_valor || b.ped_valor - a.ped_valor);

    // Série mensal (ano do filtro; ignora filtro de mês para mostrar a evolução).
    const evoMonths = FUNIL.meses.filter((k) => ano === 'todos' || k.startsWith(ano));
    const byMonth = groupBy(FUNIL.rows.filter(bySeller), 'mes');
    const monthly = evoMonths.map((k) => {
      const rs = byMonth.get(k) ?? [];
      const t = sum(rs);
      const row = {
        mes: k,
        label: mesLabel(k, ano === 'todos'),
        ...t,
        conv: t.orc_qtd ? t.ped_qtd / t.orc_qtd : null,
        aprov: t.orc_qtd ? t.orc_aprov / t.orc_qtd : null,
        selected: atual.includes(k),
      };
      for (const v of FUNIL.vendedores) row[`orc:${v}`] = row[`apr:${v}`] = row[`ped:${v}`] = 0;
      for (const r of rs) {
        row[`fat:${r.vendedor}`] = r.fat_valor;
        row[`orc:${r.vendedor}`] = r.orc_qtd;
        row[`apr:${r.vendedor}`] = r.orc_aprov;
        row[`ped:${r.vendedor}`] = r.ped_qtd;
      }
      return row;
    });

    // Sazonalidade: cada métrica por mês do ano, uma linha por ano (chave `ano:métrica`).
    const season = MESES.map((m, i) => {
      const mm = String(i + 1).padStart(2, '0');
      const row = { label: m };
      for (const y of anos) {
        const k = `${y}-${mm}`;
        if (!FUNIL.meses.includes(k)) continue;
        const t = sum(byMonth.get(k) ?? []);
        for (const m of METRICAS_SAZONAL) row[`${y}:${m.value}`] = t[m.value];
      }
      return row;
    }).filter((r) => anos.some((y) => r[`${y}:fat_valor`] != null));

    return { atual, anterior, cur, prev, curCmp, sellers, fatTotal, monthly, season };
  }, [ano, mes, vendedor]);

  // Um painel de barras por vendedor: meses do ano filtrado, mesma escala.
  const porVendedor = useMemo(() => {
    const months = FUNIL.meses.filter((k) => ano === 'todos' || k.startsWith(ano));
    const nomes = FUNIL.vendedores.filter((v) => v !== SEM_VENDEDOR && (vendedor === 'todos' || v === vendedor));
    const idx = new Map(FUNIL.rows.map((r) => [`${r.mes}|${r.vendedor}`, r]));
    const series = nomes.map((v) => {
      const data = months.map((k) => ({
        mes: k,
        label: mesLabel(k, ano === 'todos'),
        valor: idx.get(`${k}|${v}`)?.[metrica] ?? 0,
      }));
      return { vendedor: v, data, total: data.reduce((a, d) => a + d.valor, 0) };
    });
    const raw = Math.max(0, ...series.flatMap((s) => s.data.map((d) => d.valor)));
    // Topo redondo (1, 2, 2.5, 5 × 10^n) para ticks legíveis em 4 passos.
    const step = 10 ** Math.floor(Math.log10(raw / 4 || 1));
    const nice = [1, 2, 2.5, 5, 10].map((f) => f * step).find((st) => st * 4 >= raw) ?? raw / 4;
    return { series, max: nice * 4 };
  }, [ano, vendedor, metrica]);

  const insights = useMemo(() => buildInsights(view, vendedor), [view, vendedor]);

  const { cur, prev, curCmp } = view;
  const cmp = prev && curCmp ? { cur: curCmp, prev } : null;
  const cmpHint = cmp ? `vs mesmo período ${Number(ano) - 1}` : null;
  const ticket = cur.ped_qtd ? cur.ped_valor / cur.ped_qtd : 0;
  const aprov = cur.orc_qtd ? cur.orc_aprov / cur.orc_qtd : NaN;
  const conv = cur.orc_qtd ? cur.ped_qtd / cur.orc_qtd : NaN;
  const periodoLabel =
    view.atual.length === 1
      ? mesLabel(view.atual[0])
      : view.atual.length
        ? `${mesLabel(view.atual[0])} – ${mesLabel(view.atual[view.atual.length - 1])}`
        : '—';
  const parcial = view.atual.includes(ultimoMes);

  const axisProps = {
    stroke: chartTheme.grid,
    tick: { fill: chartTheme.tick, fontSize: 11 },
    tickLine: false,
  };
  const etapaUnica = etapasFunil.length === 1 ? etapasFunil[0] : null;
  const sazSel = METRICAS_SAZONAL.filter((m) => sazMetricas.includes(m.value));
  // Média mensal do ano, só nos meses com dados (ano corrente: até o último mês do snapshot).
  const mediaAno = (metrica, y) => {
    const vals = view.season.map((r) => r[`${y}:${metrica}`]).filter((v) => v != null);
    return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : 0;
  };
  const medida = FUNIL_MEDIDAS[funilMedida];
  const legendText = (v) => <span style={{ color: chartTheme.text }}>{v}</span>;
  const sellersForStack = vendedor === 'todos' ? FUNIL.vendedores.filter((v) => v !== SEM_VENDEDOR) : [vendedor];
  const sellersFunil = sellersForStack.filter((v) => view.monthly.some((m) => m[`orc:${v}`] || m[`ped:${v}`]));

  return (
    <div className="page page-dashboard page-exec">
      <BrandBar eyebrow="Visão executiva" />
      <header className="header">
        <div>
          <h1>Funil comercial</h1>
          <p className="subtitle">
            {periodoLabel}
            {parcial && ' · mês corrente parcial'} · snapshot {new Date(`${FUNIL.geradoEm}T12:00:00`).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </header>

      <div className="filters">
        <Select
          label="Ano"
          value={ano}
          onChange={setAno}
          options={[{ value: 'todos', label: '2025–2026' }, ...anos.map((y) => ({ value: y, label: y }))]}
        />
        <Select
          label="Mês"
          value={mes}
          onChange={setMes}
          options={[
            { value: 'todos', label: 'Ano inteiro' },
            ...MESES.map((m, i) => ({ value: String(i + 1).padStart(2, '0'), label: m })),
          ]}
        />
        <Select
          label="Vendedor"
          value={vendedor}
          onChange={setVendedor}
          options={[{ value: 'todos', label: 'Todos' }, ...FUNIL.vendedores.map((v) => ({ value: v, label: v }))]}
        />
      </div>

      {!view.atual.length ? (
        <p className="empty">Sem dados para este período.</p>
      ) : (
        <>
          <section className="kpi-grid kpi-grid-exec">
            <Kpi
              label="Faturamento"
              value={money(cur.fat_valor)}
              delta={cmp && <Delta cur={cmp.cur.fat_valor} prev={cmp.prev.fat_valor} />}
              hint={cmpHint}
            />
            <Kpi
              label="Pedidos"
              value={int.format(cur.ped_qtd)}
              delta={cmp && <Delta cur={cmp.cur.ped_qtd} prev={cmp.prev.ped_qtd} />}
              hint={money(cur.ped_valor)}
            />
            <Kpi label="Ticket médio pedido" value={brl.format(ticket)} hint="valor ÷ qtd de pedidos" />
            <Kpi
              label="Orçamentos"
              value={int.format(cur.orc_qtd)}
              delta={cmp && <Delta cur={cmp.cur.orc_qtd} prev={cmp.prev.orc_qtd} />}
              hint={`${int.format(cur.orc_aprov)} aprovados`}
            />
            <Kpi label="Taxa de aprovação" value={pct(aprov)} hint="aprovados ÷ orçamentos" />
            <Kpi label="Conversão orç → pedido" value={pct(conv)} hint="pedidos ÷ orçamentos" />
          </section>

          <div className="dash-grid dash-grid-charts">
            <section className="dash-panel dash-panel-wide">
              <div className="panel-head">
                <div>
                  <h2>Sazonalidade</h2>
                  <p className="panel-note">
                    mesmo mês, ano contra ano{vendedor !== 'todos' ? ` · ${vendedor}` : ''} · tracejado = média mensal do ano · um gráfico por métrica
                  </p>
                </div>
                <MultiChips label="Métricas" options={METRICAS_SAZONAL} value={sazMetricas} onChange={setSazMetricas} />
              </div>
              {!view.season.length ? (
                <p className="muted">Sem dados</p>
              ) : (
                <div className={`saz-grid${sazSel.length > 1 ? ' saz-grid-multi' : ''}`}>
                  {sazSel.map((m) => (
                    <figure key={m.value} className="saz-chart">
                      <figcaption>
                        {sazSel.length > 1 && <span className="saz-title">{m.label}</span>}
                        <span className="saz-avg">
                          Média mensal:{' '}
                          {anos.map((y, i) => (
                            <span key={y}>
                              <i className="swatch" style={{ background: i === anos.length - 1 ? palette[0] : NEUTRO }} />
                              {y} <strong>{m.full(mediaAno(m.value, y))}</strong>
                            </span>
                          ))}
                          {anos.length > 1 && (
                            <Delta cur={mediaAno(m.value, anos[anos.length - 1])} prev={mediaAno(m.value, anos[anos.length - 2])} />
                          )}
                        </span>
                      </figcaption>
                      <ResponsiveContainer width="100%" height={sazSel.length > 1 ? 220 : 260}>
                        <LineChart data={view.season} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" {...axisProps} />
                          <YAxis
                            {...axisProps}
                            width={m.value.endsWith('valor') ? 84 : 40}
                            tickFormatter={m.format}
                            allowDecimals={false}
                          />
                          <Tooltip content={<ChartTooltip format={m.full} />} />
                          <Legend formatter={legendText} />
                          {anos.map((y, i) => (
                            <ReferenceLine
                              key={`media-${y}`}
                              y={mediaAno(m.value, y)}
                              stroke={i === anos.length - 1 ? palette[0] : NEUTRO}
                              strokeDasharray="5 4"
                              strokeOpacity={0.8}
                            />
                          ))}
                          {anos.map((y, i) => (
                            <Line
                              isAnimationActive={false}
                              key={y}
                              type="monotone"
                              dataKey={`${y}:${m.value}`}
                              name={y}
                              stroke={i === anos.length - 1 ? palette[0] : NEUTRO}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              connectNulls={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            <section className="dash-panel dash-panel-wide">
              <h2>Funil do período</h2>
              <div className="funnel-pair">
                <div>
                  <FunnelBars
                    title="Quantidade"
                    stages={[
                      { label: 'Orçamentos', value: cur.orc_qtd, display: int.format(cur.orc_qtd) },
                      {
                        label: 'Aprovados',
                        value: cur.orc_aprov,
                        display: int.format(cur.orc_aprov),
                        conv: cur.orc_qtd ? cur.orc_aprov / cur.orc_qtd : null,
                        convLabel: 'dos orçamentos',
                      },
                      {
                        label: 'Pedidos',
                        value: cur.ped_qtd,
                        display: int.format(cur.ped_qtd),
                        conv: cur.orc_aprov ? cur.ped_qtd / cur.orc_aprov : null,
                        convLabel: 'dos aprovados',
                      },
                    ]}
                  />
                </div>
                <div>
                  <FunnelBars
                    title="Valor (R$)"
                    stages={[
                      { label: 'Aprovado', value: cur.orc_aprov_valor, display: money(cur.orc_aprov_valor) },
                      {
                        label: 'Em pedidos',
                        value: cur.ped_valor,
                        display: money(cur.ped_valor),
                        conv: cur.orc_aprov_valor ? cur.ped_valor / cur.orc_aprov_valor : null,
                        convLabel: 'do aprovado',
                      },
                      {
                        label: 'Faturado',
                        value: cur.fat_valor,
                        display: money(cur.fat_valor),
                        conv: cur.ped_valor ? cur.fat_valor / cur.ped_valor : null,
                        convLabel: 'dos pedidos',
                      },
                    ]}
                  />
                </div>
              </div>
              <p className="panel-note">
                Faturamento é lançado por período de cobrança, não por pedido: em recortes curtos ele pode passar de
                100% dos pedidos do mesmo mês. Valor total orçado (incl. cancelados): {money(cur.orc_valor)}.
              </p>
            </section>

            <section className="dash-panel dash-panel-wide insights">
              <h2>Leitura executiva</h2>
              <ul>
                {insights.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>

            <ChartPanel
              half
              title="Ranking de faturamento por vendedor"
              note={`${periodoLabel} · rótulo = participação no faturamento`}
              empty={!view.fatTotal}
            >
              <ResponsiveContainer width="100%" height={Math.max(220, view.sellers.length * 38)}>
                <BarChart
                  data={view.sellers.filter((s) => s.vendedor !== SEM_VENDEDOR)}
                  layout="vertical"
                  margin={{ top: 4, right: 56, left: 8, bottom: 0 }}
                  barCategoryGap={6}
                >
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" {...axisProps} tickFormatter={money} />
                  <YAxis type="category" dataKey="vendedor" width={84} {...axisProps} />
                  <Tooltip content={<ChartTooltip format={(v) => brl.format(v)} />} cursor={{ fill: chartTheme.grid, opacity: 0.4 }} />
                  <Bar
                      isAnimationActive={false}
                    dataKey="fat_valor"
                    name="Faturamento"
                    radius={[0, 4, 4, 0]}
                    shape={(p) => {
                      const dim = vendedor !== 'todos' && p.payload.vendedor !== vendedor;
                      return (
                        <rect
                          x={p.x}
                          y={p.y}
                          width={Math.max(p.width, 0)}
                          height={p.height}
                          rx={4}
                          fill={colorOf(p.payload.vendedor)}
                          opacity={dim ? 0.3 : 1}
                        />
                      );
                    }}
                  >
                    <LabelList
                      dataKey="share"
                      position="right"
                      formatter={(v) => pct(v)}
                      style={{ fill: chartTheme.text, fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel half title="Conversão mensal" note="pedidos ÷ orçamentos e aprovados ÷ orçamentos" empty={!view.monthly.length}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={view.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} width={40} tickFormatter={(v) => pct(v)} domain={[0, 'auto']} />
                  <Tooltip content={<ChartTooltip format={(v) => pct(v, 1)} />} />
                  <Legend formatter={legendText} />
                  <Line isAnimationActive={false} type="monotone" dataKey="aprov" name="Aprovação" stroke={palette[0]} strokeWidth={2} dot={{ r: 3 }} />
                  <Line isAnimationActive={false} type="monotone" dataKey="conv" name="Orç → pedido" stroke={palette[1]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            <section className="dash-panel dash-panel-wide">
              <div className="panel-head">
                <div>
                  <h2>Funil mensal por vendedor</h2>
                  <p className="panel-note">
                    {ano === 'todos' ? 'Jan/25 – mês atual' : ano} ·{' '}
                    {etapaUnica
                      ? `${STAGE_LINE[etapaUnica].label.toLowerCase()} por vendedor`
                      : funilModo === 'linhas'
                        ? 'cor = vendedor, traço = etapa'
                        : 'uma coluna por vendedor em cada mês, etapas sobrepostas a partir da base'}
                  </p>
                </div>
                <div className="panel-controls">
                  <StageChips value={etapasFunil} onChange={setEtapasFunil} />
                  <Tabs
                    label="Formato do gráfico"
                    value={funilModo}
                    onChange={setFunilModo}
                    options={[
                      { value: 'linhas', label: 'Linhas' },
                      { value: 'barras', label: 'Barras' },
                    ]}
                  />
                </div>
              </div>
              {!sellersFunil.length ? (
                <p className="muted">Sem dados</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={340}>
                    {funilModo === 'linhas' ? (
                      <LineChart data={view.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" {...axisProps} />
                        <YAxis {...axisProps} width={40} allowDecimals={false} />
                        <Tooltip
                          content={<FunilTooltip sellers={sellersFunil} colorOf={colorOf} etapas={etapasFunil} />}
                          cursor={{ stroke: chartTheme.tick, strokeDasharray: '3 3' }}
                        />
                        {sellersFunil.flatMap((v) =>
                          etapasFunil.map((k) => {
                            const st = STAGE_LINE[k];
                            // Etapa única: linha cheia com pontos; várias: traço identifica a etapa.
                            const unica = !!etapaUnica;
                            return (
                              <Line
                                isAnimationActive={false}
                                key={`${k}:${v}`}
                                type="linear"
                                dataKey={`${k}:${v}`}
                                name={`${v} · ${st.label}`}
                                stroke={colorOf(v)}
                                strokeWidth={unica ? 2 : st.width}
                                strokeDasharray={unica ? undefined : st.dash}
                                dot={unica || k === 'ped' ? { r: 3, strokeWidth: 0, fill: colorOf(v) } : false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: chartTheme.surface }}
                              />
                            );
                          }),
                        )}
                      </LineChart>
                    ) : (
                      <BarChart data={view.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="12%" barGap={2}>
                        <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" {...axisProps} />
                        <YAxis {...axisProps} width={40} allowDecimals={false} />
                        <Tooltip
                          content={<FunilTooltip sellers={sellersFunil} colorOf={colorOf} etapas={etapasFunil} />}
                          cursor={{ fill: chartTheme.grid, opacity: 0.4 }}
                        />
                        {sellersFunil.map((v) =>
                          !etapaUnica ? (
                            <Bar
                              isAnimationActive={false}
                              key={v}
                              dataKey={(row) => Math.max(...etapasFunil.map((k) => row[`${k}:${v}`] ?? 0))}
                              name={v}
                              fill={colorOf(v)}
                              shape={(p) => <FunilShape {...p} vendedor={v} fill={colorOf(v)} etapas={etapasFunil} />}
                            />
                          ) : (
                            <Bar
                              isAnimationActive={false}
                              key={v}
                              dataKey={`${etapaUnica}:${v}`}
                              name={v}
                              fill={colorOf(v)}
                              radius={[3, 3, 0, 0]}
                            />
                          ),
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                  <div className="line-legend">
                    <span className="line-legend-group">
                      {sellersFunil.map((v) => (
                        <span key={v}>
                          <i className="swatch" style={{ background: colorOf(v) }} />
                          {v}
                        </span>
                      ))}
                    </span>
                    {!etapaUnica &&
                      (funilModo === 'linhas' ? (
                        <span className="line-legend-group">
                          {etapasFunil.map((k) => (
                            <span key={k}>
                              <StageSample k={k} /> {STAGE_LINE[k].label}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="line-legend-group stage-key">
                          {etapasFunil.map((k) => (
                            <span key={k}>
                              <i style={{ opacity: STAGE_OPACITY[k] }} /> {STAGE_LINE[k].label}
                            </span>
                          ))}
                        </span>
                      ))}
                  </div>
                </>
              )}
            </section>

            <ChartPanel
              title="Evolução do faturamento por vendedor"
              wide
              note={ano === 'todos' ? 'Jan/25 – mês atual' : `${ano} · todos os meses (filtro de mês destacado no ranking)`}
              empty={!view.monthly.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={view.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="14%" barGap={2}>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} width={84} tickFormatter={money} />
                  <Tooltip
                    content={<ChartTooltip format={(v) => brl.format(v)} />}
                    cursor={{ fill: chartTheme.grid, opacity: 0.4 }}
                  />
                  <Legend formatter={legendText} />
                  {sellersForStack.map((v) => (
                    <Bar
                      isAnimationActive={false}
                      key={v}
                      dataKey={`fat:${v}`}
                      name={v}
                      fill={colorOf(v)}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <section className="dash-panel dash-panel-wide">
              <div className="panel-head">
                <div>
                  <h2>Vendedor por mês</h2>
                  <p className="panel-note">
                    {ano === 'todos' ? 'Jan/25 – mês atual' : ano} · uma barra por mês · mesma escala em todos os painéis
                  </p>
                </div>
                <Select label="Métrica" value={metrica} onChange={setMetrica} options={METRICAS} />
              </div>
              <div className="multiples">
                {porVendedor.series.map((sv) => {
                  const m = METRICAS.find((x) => x.value === metrica);
                  return (
                    <figure key={sv.vendedor} className="multiple">
                      <figcaption>
                        <span>
                          <i className="swatch" style={{ background: colorOf(sv.vendedor) }} />
                          {sv.vendedor}
                        </span>
                        <strong>{m.format(sv.total)}</strong>
                      </figcaption>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={sv.data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
                          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" {...axisProps} interval={ano === 'todos' ? 2 : 0} fontSize={10} />
                          <YAxis
                            {...axisProps}
                            width={metrica.endsWith('valor') ? 84 : 32}
                            domain={[0, porVendedor.max || 1]}
                            tickFormatter={m.format}
                            tickCount={5}
                          />
                          <Tooltip
                            content={<ChartTooltip format={m.full} />}
                            cursor={{ fill: chartTheme.grid, opacity: 0.4 }}
                          />
                          <Bar
                            isAnimationActive={false}
                            dataKey="valor"
                            name={m.label}
                            fill={colorOf(sv.vendedor)}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </figure>
                  );
                })}
              </div>
            </section>

            <section className="dash-panel dash-panel-wide">
              <div className="panel-head">
                <div>
                  <h2>Funil mensal ({funilMedida === 'qtd' ? 'quantidade' : 'valor'})</h2>
                  <p className="panel-note">
                    {FUNIL_MEDIDAS[funilMedida].etapas.map(([, n]) => n.toLowerCase()).join(', ')} por mês
                  </p>
                </div>
                <div className="panel-controls">
                  <Select
                    label="Medida"
                    value={funilMedida}
                    onChange={setFunilMedida}
                    options={Object.entries(FUNIL_MEDIDAS).map(([value, m]) => ({ value, label: m.label }))}
                  />
                  <Tabs
                    label="Formato do gráfico"
                    value={funilTotalModo}
                    onChange={setFunilTotalModo}
                    options={[
                      { value: 'linhas', label: 'Linhas' },
                      { value: 'barras', label: 'Barras' },
                    ]}
                  />
                </div>
              </div>
              {!view.monthly.length ? (
                <p className="muted">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {funilTotalModo === 'linhas' ? (
                    <LineChart data={view.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis {...axisProps} width={medida.width} tickFormatter={medida.format} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip format={medida.full} />} cursor={{ stroke: chartTheme.tick, strokeDasharray: '3 3' }} />
                      <Legend formatter={legendText} itemSorter={null} />
                      {medida.etapas.map(([key, name, slot]) => (
                        <Line
                          isAnimationActive={false}
                          key={key}
                          type="linear"
                          dataKey={key}
                          name={name}
                          stroke={palette[slot]}
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 0, fill: palette[slot] }}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: chartTheme.surface }}
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={view.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
                      <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis {...axisProps} width={medida.width} tickFormatter={medida.format} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip format={medida.full} />} cursor={{ fill: chartTheme.grid, opacity: 0.4 }} />
                      <Legend formatter={legendText} itemSorter={null} />
                      {medida.etapas.map(([key, name, slot]) => (
                        <Bar isAnimationActive={false} key={key} dataKey={key} name={name} fill={palette[slot]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </section>
          </div>

          <div className="dash-tables">
            <section className="dash-panel dash-panel-wide">
              <h2>Desempenho por vendedor · {periodoLabel}</h2>
              <div className="table-wrap">
                <table className="dash-table num-table">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Orçamentos</th>
                      <th>Aprov.</th>
                      <th>Taxa aprov.</th>
                      <th>Pedidos</th>
                      <th>Valor pedidos</th>
                      <th>Ticket médio</th>
                      <th>Faturamento</th>
                      <th>Part.</th>
                      <th title="mediana de dias entre orçamento e pedido">Orç→ped (dias)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.sellers.map((s) => (
                      <tr key={s.vendedor} className={vendedor !== 'todos' && vendedor !== s.vendedor ? 'row-dim' : ''}>
                        <td>
                          <i className="swatch" style={{ background: colorOf(s.vendedor) }} />
                          {s.vendedor}
                        </td>
                        <td>{int.format(s.orc_qtd)}</td>
                        <td>{int.format(s.orc_aprov)}</td>
                        <td>{s.orc_qtd ? pct(s.orc_aprov / s.orc_qtd) : '—'}</td>
                        <td>{int.format(s.ped_qtd)}</td>
                        <td>{brl.format(s.ped_valor)}</td>
                        <td>{s.ped_qtd ? brl.format(s.ped_valor / s.ped_qtd) : '—'}</td>
                        <td>{brl.format(s.fat_valor)}</td>
                        <td>{pct(s.share)}</td>
                        <td>{Number.isFinite(s.lead) ? int.format(s.lead) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-panel dash-panel-wide">
              <h2>Maiores clientes em pedidos · 2025–2026</h2>
              <div className="table-wrap">
                <table className="dash-table num-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Pedidos</th>
                      <th>Valor</th>
                      <th>Vendedor(es)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FUNIL.topClientes.slice(0, 10).map((c) => (
                      <tr key={c.cliente}>
                        <td title={c.cliente}>{c.cliente}</td>
                        <td>{int.format(c.pedidos)}</td>
                        <td>{brl.format(c.valor)}</td>
                        <td>{c.vendedores.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-panel dash-panel-wide quality">
              <h2>Notas sobre os dados</h2>
              <ul>
                <li>
                  Faturamento lido linha a linha das abas mensais. O <em>Resumo</em> da planilha soma a linha
                  “Total: R$ …” junto com os vendedores em 12 meses e chega a R$ 4,27 mi; o valor real é{' '}
                  {money(FUNIL.rows.reduce((a, r) => a + r.fat_valor, 0))}.
                </li>
                {FUNIL.qualidade.faturamentoMesesFuturosDescartados.length > 0 && (
                  <li>
                    Abas futuras de faturamento ({FUNIL.qualidade.faturamentoMesesFuturosDescartados.map((k) => mesLabel(k)).join(', ')}) só têm
                    zeros e ficaram de fora.
                  </li>
                )}
                <li>
                  {FUNIL.qualidade.orcamentosSemVendedor} orçamentos sem vendedor aparecem como “{SEM_VENDEDOR}”.{' '}
                  {FUNIL.qualidade.pedidosLigadosAOrcamento} de {FUNIL.qualidade.pedidosTotal} pedidos foram ligados ao
                  orçamento de origem (tempo orç → pedido).
                </li>
                <li>
                  Fonte: {FUNIL.fonte}. Para atualizar: <code>python3 scripts/build-funil.py</code>.
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function buildInsights(view, vendedor) {
  const out = [];
  const { cur, sellers, fatTotal, monthly, prev, curCmp } = view;
  const named = sellers.filter((s) => s.vendedor !== SEM_VENDEDOR);

  if (fatTotal && vendedor === 'todos' && named.length) {
    const [a, b] = named;
    out.push(
      `${a.vendedor} lidera o faturamento com ${money(a.fat_valor)} (${pct(a.share)} do total)` +
        (b ? `; com ${b.vendedor}, os dois primeiros somam ${pct(a.share + b.share)} — concentração ${a.share + b.share > 0.6 ? 'alta' : 'moderada'}.` : '.'),
    );
  } else if (vendedor !== 'todos') {
    const s = sellers.find((x) => x.vendedor === vendedor);
    if (s) {
      const pos = named.findIndex((x) => x.vendedor === vendedor) + 1;
      out.push(`${vendedor}: ${money(s.fat_valor)} faturados (${pct(s.share)} do total, ${pos}º lugar) e ${int.format(s.ped_qtd)} pedidos.`);
    }
  }

  if (prev && curCmp && prev.fat_valor) {
    const d = curCmp.fat_valor / prev.fat_valor - 1;
    const dp = prev.ped_qtd ? curCmp.ped_qtd / prev.ped_qtd - 1 : NaN;
    out.push(
      `Contra o mesmo período do ano anterior, faturamento ${d >= 0 ? 'subiu' : 'caiu'} ${pct(Math.abs(d))} ` +
        `(${money(prev.fat_valor)} → ${money(curCmp.fat_valor)})` +
        (Number.isFinite(dp) ? ` e pedidos ${dp >= 0 ? 'subiram' : 'caíram'} ${pct(Math.abs(dp))}.` : '.'),
    );
  }

  const withFat = monthly.filter((m) => m.fat_valor > 0);
  if (withFat.length > 2) {
    const best = withFat.reduce((a, b) => (b.fat_valor > a.fat_valor ? b : a));
    const worst = withFat.reduce((a, b) => (b.fat_valor < a.fat_valor ? b : a));
    out.push(`Melhor mês de faturamento: ${mesLabel(best.mes)} (${money(best.fat_valor)}); mais fraco: ${mesLabel(worst.mes)} (${money(worst.fat_valor)}).`);
  }

  const med = median(monthly.map((m) => m.orc_valor).filter(Boolean));
  const atipicos = monthly.filter((m) => m.orc_valor > med * 3);
  for (const m of atipicos) {
    const big = FUNIL.maioresOrcamentos.find((o) => o.mes === m.mes && (vendedor === 'todos' || o.vendedor === vendedor));
    out.push(
      `${mesLabel(m.mes)} é atípico: ${money(m.orc_valor)} orçados (${(m.orc_valor / med).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× a mediana)` +
        (big ? `, puxado por ${big.cliente} (${money(big.valor)}, ${big.status.toLowerCase()}, ${big.vendedor}).` : '.'),
    );
  }

  const elig = named.filter((s) => s.orc_qtd >= 20);
  if (elig.length > 1 && vendedor === 'todos') {
    const rate = (s) => s.orc_aprov / s.orc_qtd;
    const hi = elig.reduce((a, b) => (rate(b) > rate(a) ? b : a));
    const lo = elig.reduce((a, b) => (rate(b) < rate(a) ? b : a));
    out.push(`Taxa de aprovação vai de ${pct(rate(lo))} (${lo.vendedor}) a ${pct(rate(hi))} (${hi.vendedor}) entre quem fez 20+ orçamentos.`);
    const tk = named.filter((s) => s.ped_qtd >= 5);
    if (tk.length > 1) {
      const t = (s) => s.ped_valor / s.ped_qtd;
      const top = tk.reduce((a, b) => (t(b) > t(a) ? b : a));
      out.push(`Maior ticket médio de pedido: ${top.vendedor} (${brl.format(t(top))}), contra média geral de ${brl.format(cur.ped_valor / cur.ped_qtd)}.`);
    }
  }

  const ultimo = FUNIL.meses[FUNIL.meses.length - 1];
  const st = FUNIL.status[ultimo];
  if (view.atual.includes(ultimo) && st) {
    const aberto = (st.Enviado ?? 0) + (st['Em aberto'] ?? 0) + (st['Contra proposta'] ?? 0);
    if (aberto) out.push(`${mesLabel(ultimo)} ainda em andamento: ${aberto} orçamentos em negociação (enviado / em aberto / contra proposta) podem mudar a conversão do mês.`);
  }

  const perda = cur.orc_qtd ? cur.orc_perdido / cur.orc_qtd : 0;
  if (perda) out.push(`${pct(perda)} dos orçamentos do período foram cancelados ou reprovados.`);

  return out;
}
