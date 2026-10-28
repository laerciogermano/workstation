import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BrandBar } from './brand.jsx';
import { ChartPanel, ChartTooltip, useChartTheme } from './chart-kit.jsx';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ?? '/dashboard';

const PALETTE = [
  '#2563EB',
  '#1F9D6B',
  '#D97706',
  '#6D28D9',
  '#D93A40',
  '#6EA2FF',
  '#A9B4C8',
  '#5A6377',
];

const INVITE_LABEL = {
  connected: 'conectado',
  conectado: 'conectado',
  pending: 'pendente',
  pendente: 'pendente',
  connect: 'não enviado',
  none: 'não enviado',
};

function formatDay(key) {
  if (!key) return '—';
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function inviteLabel(status) {
  if (!status) return '—';
  const key = String(status).trim().toLowerCase();
  return INVITE_LABEL[key] ?? 'não enviado';
}

const EMPTY_INSIGHTS = {
  kpis: [],
  byInviteStatus: [],
  byConnStatus: [],
  byDegree: [],
  byCity: [],
  byTitle: [],
  byCompany: [],
  byDayExtract: [],
  byDayConnected: [],
  byDayInvited: [],
  recent: [],
};

function mergeDaily(extract, connected, invited) {
  const map = new Map();
  const bump = (rows, key) => {
    for (const r of rows) {
      const cur = map.get(r.label) ?? {
        day: r.label,
        label: formatDay(r.label),
        extracts: 0,
        connected: 0,
        invited: 0,
      };
      cur[key] = r.count;
      map.set(r.label, cur);
    }
  };
  bump(extract, 'extracts');
  bump(connected, 'connected');
  bump(invited, 'invited');
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function DataTable({ title, columns, rows, emptyLabel = 'Sem linhas' }) {
  return (
    <section className="dash-panel dash-panel-wide">
      <h2>{title}</h2>
      {!rows.length ? (
        <p className="muted">{emptyLabel}</p>
      ) : (
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? row.key ?? i}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CountTable({ title, rows, labelHeader = 'Item' }) {
  return (
    <DataTable
      title={title}
      emptyLabel="Sem dados"
      columns={[
        { key: 'label', label: labelHeader },
        { key: 'count', label: 'Qtd' },
        {
          key: 'pct',
          label: '%',
          render: (row) =>
            row.pct !== undefined && row.pct !== null ? `${row.pct}%` : '—',
        },
      ]}
      rows={rows}
    />
  );
}

export default function Dashboard({
  onOpenProfile,
  onGoHome,
  theme,
  onToggleTheme,
}) {
  const chartTheme = useChartTheme();
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let first = true;

    async function load() {
      if (first) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(DASHBOARD_URL);
        if (!res.ok) throw new Error(`dashboard HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setInsights({
          kpis: Array.isArray(json.kpis) ? json.kpis : [],
          byInviteStatus: Array.isArray(json.byInviteStatus)
            ? json.byInviteStatus
            : [],
          byConnStatus: Array.isArray(json.byConnStatus)
            ? json.byConnStatus
            : [],
          byDegree: Array.isArray(json.byDegree) ? json.byDegree : [],
          byCity: Array.isArray(json.byCity) ? json.byCity : [],
          byTitle: Array.isArray(json.byTitle) ? json.byTitle : [],
          byCompany: Array.isArray(json.byCompany) ? json.byCompany : [],
          byDayExtract: Array.isArray(json.byDayExtract)
            ? json.byDayExtract
            : [],
          byDayConnected: Array.isArray(json.byDayConnected)
            ? json.byDayConnected
            : [],
          byDayInvited: Array.isArray(json.byDayInvited)
            ? json.byDayInvited
            : [],
          recent: Array.isArray(json.recent) ? json.recent : [],
        });
        setError(null);
      } catch (e) {
        if (!cancelled && first) {
          setError(e.message ?? 'Falha ao carregar dashboard');
        }
      } finally {
        if (!cancelled && first) setLoading(false);
        first = false;
      }
    }

    load();
    const id = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const timeline = useMemo(
    () =>
      mergeDaily(
        insights.byDayExtract,
        insights.byDayConnected,
        insights.byDayInvited,
      ),
    [
      insights.byDayExtract,
      insights.byDayConnected,
      insights.byDayInvited,
    ],
  );

  const axisProps = {
    stroke: chartTheme.tick,
    tick: { fill: chartTheme.tick, fontSize: 11 },
  };

  return (
    <div className="page page-dashboard">
      <BrandBar eyebrow="Insights" />
      <header className="header">
        <div>
          <h1>Dashboards</h1>
          <p className="subtitle">
            {loading
              ? 'Carregando insights…'
              : 'Conexões · extratos · cidades · cargos · empresas'}
          </p>
        </div>
      </header>

      {error && (
        <p className="error">
          Erro: {error}. Confirme a API em{' '}
          <code>http://localhost:3000/dashboard</code>.
        </p>
      )}

      {(
        [
          {
            key: 'funil',
            title: 'Funil de convites',
            note: 'Status do perfil na base',
            fallback: [
              { label: 'Perfis na base', value: '…' },
              { label: 'Sem convite', value: '…' },
              { label: 'Aguardando aceite', value: '…' },
              { label: 'Conectados', value: '…' },
            ],
          },
          {
            key: 'hoje',
            title: 'Hoje',
            note: 'Movimento do dia',
            fallback: [
              { label: 'Extraídos', value: '…' },
              { label: 'Convites enviados', value: '…' },
              { label: 'Aceites', value: '…' },
            ],
          },
        ]
      ).map((group) => {
        const rows = insights.kpis.length
          ? insights.kpis.filter((k) => (k.group ?? 'funil') === group.key)
          : group.fallback;
        return (
          <section key={group.key} className="kpi-group">
            <div className="kpi-group-head">
              <h2 className="kpi-group-title">{group.title}</h2>
              <p className="kpi-group-note">{group.note}</p>
            </div>
            <div className="kpi-grid">
              {rows.map((kpi) => (
                <article key={kpi.label} className="kpi">
                  <p className="kpi-label">{kpi.label}</p>
                  <p className="kpi-value">{loading ? '…' : kpi.value}</p>
                  {kpi.hint && !loading && (
                    <p className="kpi-hint">{kpi.hint}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <div className="dash-grid dash-grid-charts">
        <ChartPanel
          title="Atividade por dia (30d)"
          wide
          note="Extrações, convites e aceites"
          empty={!timeline.length}
          emptyLabel="Sem atividade com data"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={timeline}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} width={36} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="extracts"
                name="Extrações"
                stroke={chartTheme.accent}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="invited"
                name="Convites"
                stroke="#D97706"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="connected"
                name="Conectados"
                stroke="#1F9D6B"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Status do perfil (invite)"
          empty={!insights.byInviteStatus.length}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={insights.byInviteStatus}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
                label={({ pct: p }) => (p ? `${p}%` : '')}
              >
                {insights.byInviteStatus.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Conexões por agente (status)"
          empty={!insights.byConnStatus.length}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={insights.byConnStatus}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={88}
                label={({ pct: p }) => (p ? `${p}%` : '')}
              >
                {insights.byConnStatus.map((_, i) => (
                  <Cell key={i} fill={PALETTE[(i + 1) % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Grau de conexão" empty={!insights.byDegree.length}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={insights.byDegree}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={72} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Perfis"
                fill={chartTheme.accentSoft}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Top cargos" empty={!insights.byTitle.length}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={insights.byTitle}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                {...axisProps}
                tickFormatter={(v) =>
                  String(v).length > 18 ? `${String(v).slice(0, 18)}…` : v
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Perfis"
                fill={chartTheme.accent}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Top cidades" empty={!insights.byCity.length}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={insights.byCity}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                {...axisProps}
                tickFormatter={(v) =>
                  String(v).length > 16 ? `${String(v).slice(0, 16)}…` : v
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Perfis"
                fill="#6D28D9"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Top empresas" empty={!insights.byCompany.length} wide>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={insights.byCompany}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                {...axisProps}
                tickFormatter={(v) =>
                  String(v).length > 22 ? `${String(v).slice(0, 22)}…` : v
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Perfis"
                fill="#1F9D6B"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="dash-tables">
        <CountTable
          title="Status do perfil (invite)"
          labelHeader="Status"
          rows={insights.byInviteStatus}
        />
        <CountTable
          title="Conexões (agente)"
          labelHeader="Status"
          rows={insights.byConnStatus}
        />
        <CountTable title="Cargos" labelHeader="Cargo" rows={insights.byTitle} />
        <CountTable
          title="Cidades"
          labelHeader="Cidade"
          rows={insights.byCity}
        />
        <CountTable
          title="Empresas"
          labelHeader="Empresa"
          rows={insights.byCompany}
        />
        <DataTable
          title="Perfis recentes"
          columns={[
            {
              key: 'name',
              label: 'Nome',
              render: (row) =>
                row.id ? (
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => onOpenProfile?.(row)}
                  >
                    {row.name ?? '—'}
                  </button>
                ) : (
                  row.name ?? '—'
                ),
            },
            { key: 'title', label: 'Cargo' },
            { key: 'company', label: 'Empresa' },
            { key: 'city', label: 'Cidade' },
            {
              key: 'inviteStatus',
              label: 'Status',
              render: (row) => inviteLabel(row.inviteStatus),
            },
            { key: 'connectionDegree', label: 'Grau' },
            {
              key: 'when',
              label: 'Quando',
              render: (row) => formatWhen(row.when),
            },
          ]}
          rows={insights.recent}
        />
      </div>
    </div>
  );
}
