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

function photoSrc(base64) {
  if (!base64) return null;
  if (base64.startsWith('data:')) return base64;
  return `data:image/png;base64,${base64}`;
}

function initials(name) {
  return (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function RecentAvatar({ name, photoBase64 }) {
  const src = photoSrc(photoBase64);
  if (src) {
    return <img className="dash-avatar" src={src} alt="" loading="lazy" />;
  }
  return (
    <div className="dash-avatar dash-avatar-fallback" aria-hidden>
      {initials(name)}
    </div>
  );
}

const EMPTY_INSIGHTS = {
  kpis: [],
  byInviteStatus: [],
  byFunil: [],
  byConnStatus: [],
  byDegree: [],
  byCity: [],
  byTitle: [],
  byCompany: [],
  byDayExtract: [],
  byDayConnected: [],
  byDayInvited: [],
  byDayAbordados: [],
  byDayRespondidos: [],
  byProcedure: [],
  byAgent: [],
  recent: [],
};

/** Heartbeat recente = online (2 min). */
const HEARTBEAT_ONLINE_MS = 2 * 60 * 1000;

/**
 * Premissas de potencial (produtividade real, não capacidade teórica diária):
 * 400 conexões/agente/mês → R$ 1.000 MRR; 1.200 conexões → 1 cliente.
 */
const PROJ = {
  conexoesPorAgenteMes: 400,
  mrrPorBloco: 1000,
  conexoesPorBloco: 400,
  conexoesPorCliente: 1200,
};

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function money(v) {
  if (!Number.isFinite(v)) return '—';
  return brl.format(Math.round(v));
}

function projectFromAgents(agentCount) {
  const n = Math.max(0, Number(agentCount) || 0);
  const conexoesMes = n * PROJ.conexoesPorAgenteMes;
  const mrrBruto = (conexoesMes / PROJ.conexoesPorBloco) * PROJ.mrrPorBloco;
  return {
    agentes: n,
    conexoesMes,
    clientes: conexoesMes / PROJ.conexoesPorCliente,
    mrrBruto,
    mrrAnual: mrrBruto * 12,
  };
}

function agentPresence(row) {
  const at = row?.lastHeartbeatAt ? new Date(row.lastHeartbeatAt).getTime() : NaN;
  if (!Number.isFinite(at)) return { key: 'offline', label: 'sem ping' };
  if (Date.now() - at <= HEARTBEAT_ONLINE_MS) {
    return { key: 'online', label: 'online' };
  }
  return { key: 'stale', label: 'ping antigo' };
}

function mergeDaily(extract, connected, invited, abordados, respondidos) {
  const map = new Map();
  const bump = (rows, key) => {
    for (const r of rows) {
      const cur = map.get(r.label) ?? {
        day: r.label,
        label: formatDay(r.label),
        extracts: 0,
        connected: 0,
        invited: 0,
        abordados: 0,
        respondidos: 0,
      };
      cur[key] = r.count;
      map.set(r.label, cur);
    }
  };
  bump(extract, 'extracts');
  bump(connected, 'connected');
  bump(invited, 'invited');
  bump(abordados, 'abordados');
  bump(respondidos, 'respondidos');
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
          byFunil: Array.isArray(json.byFunil) ? json.byFunil : [],
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
          byDayAbordados: Array.isArray(json.byDayAbordados)
            ? json.byDayAbordados
            : [],
          byDayRespondidos: Array.isArray(json.byDayRespondidos)
            ? json.byDayRespondidos
            : [],
          byProcedure: Array.isArray(json.byProcedure) ? json.byProcedure : [],
          byAgent: Array.isArray(json.byAgent) ? json.byAgent : [],
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
        insights.byDayAbordados,
        insights.byDayRespondidos,
      ),
    [
      insights.byDayExtract,
      insights.byDayConnected,
      insights.byDayInvited,
      insights.byDayAbordados,
      insights.byDayRespondidos,
    ],
  );

  const agentChart = useMemo(
    () =>
      insights.byAgent.map((a) => ({
        label:
          String(a.name || a.agentId).length > 14
            ? `${String(a.name || a.agentId).slice(0, 14)}…`
            : a.name || a.agentId,
        fullName: a.name || a.agentId,
        notSent: a.notSent,
        pending: a.pending,
        connected: a.connected,
        abordados: a.abordados ?? 0,
        respondidos: a.respondidos ?? 0,
      })),
    [insights.byAgent],
  );

  const procedureChart = useMemo(
    () =>
      insights.byProcedure.map((p) => ({
        label: p.label,
        type: p.type,
        done: p.done,
        pending: p.pending + p.claimed,
        failed: p.failed,
      })),
    [insights.byProcedure],
  );

  const agentesAtivos = useMemo(
    () => insights.byAgent.filter((a) => a.status === 'ativo').length,
    [insights.byAgent],
  );

  const projecao = useMemo(
    () => projectFromAgents(insights.byAgent.length),
    [insights.byAgent.length],
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
              : 'Funil completo · procedimentos · agentes · volume diário'}
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
            title: 'Funil (procedimentos)',
            note: 'Candidatos → Convidados → Conectados → Abordados → Respondidos',
            fallback: [
              { label: 'Perfis na base', value: '…' },
              { label: 'Candidatos', value: '…' },
              { label: 'Convidados', value: '…' },
              { label: 'Conectados', value: '…' },
              { label: 'Abordados', value: '…' },
              { label: 'Respondidos', value: '…' },
              { label: 'Descartados', value: '…' },
            ],
          },
          {
            key: 'procedimentos',
            title: 'Jobs por procedimento',
            note: 'agent_jobs concluídos (done) · fila = pending+claimed',
            fallback: [
              { label: 'Buscar candidatos', value: '…' },
              { label: 'Conectar', value: '…' },
              { label: 'Ver conexões', value: '…' },
              { label: 'Enviar prospecção', value: '…' },
              { label: 'Ler mensagens', value: '…' },
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
                <article key={`${group.key}-${kpi.label}`} className="kpi">
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

      <section className="kpi-group">
        <div className="kpi-group-head">
          <h2 className="kpi-group-title">Por agentes</h2>
          <p className="kpi-group-note">
            Funil completo por agentId · ping do worker
          </p>
        </div>
        {!loading && !insights.byAgent.length ? (
          <p className="muted">Nenhum agente cadastrado</p>
        ) : (
          <div className="agent-kpi-grid">
            {(loading && !insights.byAgent.length
              ? [{
                  agentId: '…',
                  name: '…',
                  notSent: '…',
                  pending: '…',
                  connected: '…',
                  abordados: '…',
                  respondidos: '…',
                }]
              : insights.byAgent
            ).map((a) => {
              const presence = loading ? null : agentPresence(a);
              return (
                <article key={a.agentId} className="agent-kpi">
                  <div className="agent-kpi-top">
                    <div>
                      <p className="agent-kpi-name">{a.name}</p>
                      {a.agentId !== a.name && (
                        <p className="agent-kpi-id muted">{a.agentId}</p>
                      )}
                    </div>
                    {presence && (
                      <span
                        className={`agent-presence agent-presence-${presence.key}`}
                        title={
                          a.lastHeartbeatAt
                            ? `Último ping: ${formatWhen(a.lastHeartbeatAt)}`
                            : 'Sem heartbeat'
                        }
                      >
                        {presence.label}
                      </span>
                    )}
                  </div>
                  <div className="agent-kpi-stats agent-kpi-stats-funil">
                    <div>
                      <p className="kpi-label">Candidatos</p>
                      <p className="kpi-value">{loading ? '…' : a.notSent}</p>
                    </div>
                    <div>
                      <p className="kpi-label">Convidados</p>
                      <p className="kpi-value">{loading ? '…' : a.pending}</p>
                    </div>
                    <div>
                      <p className="kpi-label">Conectados</p>
                      <p className="kpi-value">{loading ? '…' : a.connected}</p>
                    </div>
                    <div>
                      <p className="kpi-label">Abordados</p>
                      <p className="kpi-value">
                        {loading ? '…' : a.abordados ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="kpi-label">Respondidos</p>
                      <p className="kpi-value">
                        {loading ? '…' : a.respondidos ?? 0}
                      </p>
                    </div>
                  </div>
                  {!loading && (
                    <p className="kpi-hint">
                      {[
                        a.status ? `AVD ${a.status}` : null,
                        a.linkedinStatus ? `LI ${a.linkedinStatus}` : null,
                        a.runtimeStatus ? `worker ${a.runtimeStatus}` : null,
                        a.discarded ? `${a.discarded} descart.` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'sem cadastro/runtime'}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="dash-grid dash-grid-charts">
        <ChartPanel
          title="Funil por agente"
          wide
          note="Candidatos · convidados · conectados · abordados · respondidos"
          empty={!agentChart.length}
          emptyLabel="Sem agentes"
        >
          <ResponsiveContainer width="100%" height={Math.max(260, agentChart.length * 48)}>
            <BarChart
              data={agentChart}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={100} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar
                dataKey="notSent"
                name="Candidatos"
                stackId="funil"
                fill="#A9B4C8"
              />
              <Bar
                dataKey="pending"
                name="Convidados"
                stackId="funil"
                fill="#D97706"
              />
              <Bar
                dataKey="connected"
                name="Conectados"
                stackId="funil"
                fill="#1F9D6B"
              />
              <Bar
                dataKey="abordados"
                name="Abordados"
                stackId="funil"
                fill="#2563EB"
              />
              <Bar
                dataKey="respondidos"
                name="Respondidos"
                stackId="funil"
                fill="#6D28D9"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Procedimentos (jobs)"
          wide
          note="done · fila (pending+claimed) · failed"
          empty={!procedureChart.length}
          emptyLabel="Sem jobs"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={procedureChart}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                {...axisProps}
                interval={0}
                tickFormatter={(v) =>
                  String(v).length > 12 ? `${String(v).slice(0, 12)}…` : v
                }
              />
              <YAxis {...axisProps} allowDecimals={false} width={36} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="done" name="Concluídos" fill="#1F9D6B" stackId="jobs" />
              <Bar dataKey="pending" name="Fila" fill="#D97706" stackId="jobs" />
              <Bar
                dataKey="failed"
                name="Falhas"
                fill="#D93A40"
                stackId="jobs"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Atividade por dia (30d)"
          wide
          note="Extrações · convites · aceites · abordados · respondidos"
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
              <Line
                type="monotone"
                dataKey="abordados"
                name="Abordados"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="respondidos"
                name="Respondidos"
                stroke="#6D28D9"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Funil completo"
          empty={!insights.byFunil.length}
          emptyLabel="Sem dados do funil"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={insights.byFunil}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={96} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Qtd" radius={[0, 6, 6, 0]}>
                {insights.byFunil.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
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
        <DataTable
          title="Agentes"
          emptyLabel="Nenhum agente"
          columns={[
            {
              key: 'name',
              label: 'Agente',
              render: (row) => (
                <span>
                  {row.name}
                  {row.agentId !== row.name ? (
                    <span className="muted"> · {row.agentId}</span>
                  ) : null}
                </span>
              ),
            },
            {
              key: 'presence',
              label: 'Ping',
              render: (row) => {
                const p = agentPresence(row);
                return (
                  <span
                    className={`agent-presence agent-presence-${p.key}`}
                    title={
                      row.lastHeartbeatAt
                        ? formatWhen(row.lastHeartbeatAt)
                        : 'Sem heartbeat'
                    }
                  >
                    {p.label}
                  </span>
                );
              },
            },
            { key: 'notSent', label: 'Candidatos' },
            { key: 'pending', label: 'Convidados' },
            { key: 'connected', label: 'Conectados' },
            {
              key: 'abordados',
              label: 'Abordados',
              render: (row) => row.abordados ?? 0,
            },
            {
              key: 'respondidos',
              label: 'Respondidos',
              render: (row) => row.respondidos ?? 0,
            },
            {
              key: 'discarded',
              label: 'Descart.',
              render: (row) => row.discarded ?? 0,
            },
            { key: 'total', label: 'Total' },
            {
              key: 'status',
              label: 'AVD',
              render: (row) => row.status ?? '—',
            },
            {
              key: 'linkedinStatus',
              label: 'LinkedIn',
              render: (row) => row.linkedinStatus ?? '—',
            },
          ]}
          rows={insights.byAgent}
        />
        <DataTable
          title="Procedimentos (jobs)"
          emptyLabel="Sem jobs"
          columns={[
            { key: 'label', label: 'Procedimento' },
            { key: 'done', label: 'Done' },
            {
              key: 'fila',
              label: 'Fila',
              render: (row) => (row.pending ?? 0) + (row.claimed ?? 0),
            },
            { key: 'failed', label: 'Falhas' },
            { key: 'total', label: 'Total' },
          ]}
          rows={insights.byProcedure}
        />
        <CountTable
          title="Funil completo"
          labelHeader="Etapa"
          rows={insights.byFunil}
        />
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
          title="Candidatos recentes"
          columns={[
            {
              key: 'name',
              label: 'Nome',
              render: (row) => (
                <span className="dash-person">
                  <RecentAvatar
                    name={row.name}
                    photoBase64={row.photoBase64}
                  />
                  {row.id ? (
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => onOpenProfile?.(row)}
                    >
                      {row.name ?? '—'}
                    </button>
                  ) : (
                    <span>{row.name ?? '—'}</span>
                  )}
                </span>
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

      <section className="kpi-group proj-group">
        <div className="kpi-group-head">
          <h2 className="kpi-group-title">Projeção financeira</h2>
          <p className="kpi-group-note">
            {PROJ.conexoesPorAgenteMes} conexões/agente/mês ·{' '}
            {money(PROJ.mrrPorBloco)} MRR a cada {PROJ.conexoesPorBloco}{' '}
            conexões · 1 cliente / {PROJ.conexoesPorCliente} conexões
          </p>
        </div>
        <div className="kpi-grid">
          <article className="kpi">
            <p className="kpi-label">Agentes</p>
            <p className="kpi-value">
              {loading ? '…' : projecao.agentes}
            </p>
            {!loading && (
              <p className="kpi-hint">
                {agentesAtivos} ativo
                {agentesAtivos === 1 ? '' : 's'} · base cadastrada
              </p>
            )}
          </article>
          <article className="kpi">
            <p className="kpi-label">Conexões / mês</p>
            <p className="kpi-value">
              {loading ? '…' : num.format(projecao.conexoesMes)}
            </p>
            <p className="kpi-hint">
              {PROJ.conexoesPorAgenteMes} × agentes
            </p>
          </article>
          <article className="kpi">
            <p className="kpi-label">Clientes estimados</p>
            <p className="kpi-value">
              {loading ? '…' : num.format(projecao.clientes)}
            </p>
            <p className="kpi-hint">
              a cada {PROJ.conexoesPorCliente} conexões
            </p>
          </article>
          <article className="kpi">
            <p className="kpi-label">Faturamento bruto (MRR)</p>
            <p className="kpi-value">
              {loading ? '…' : money(projecao.mrrBruto)}
            </p>
            <p className="kpi-hint">
              anual {loading ? '…' : money(projecao.mrrAnual)}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
