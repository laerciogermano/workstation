import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrandBar } from './brand.jsx';

const AGENTES_URL = import.meta.env.VITE_AGENTES_URL ?? '/agentes';
const AGENTE_API_URL = import.meta.env.VITE_AGENTE_URL ?? '/agente';
const AGENT_KEY = 'cx-atividades-agent';

const JOB_TYPE_LABEL = {
  ler_mensagens: 'Ler mensagens',
  verificar_conexoes: 'Verificar conexões',
  enviar_prospeccao: 'Enviar prospecção',
  conectar: 'Conectar',
  extrair_leads: 'Extrair leads',
};

const JOB_STATUS_LABEL = {
  pending: 'Pendente',
  claimed: 'Em execução',
  done: 'Concluído',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'claimed', label: 'Em execução' },
  { value: 'done', label: 'Concluídos' },
  { value: 'failed', label: 'Falhas' },
  { value: 'cancelled', label: 'Cancelados' },
];

function jobTypeLabel(t) {
  return JOB_TYPE_LABEL[t] || t || '—';
}

function jobStatusLabel(s) {
  return JOB_STATUS_LABEL[s] || s || '—';
}

function jobStatusClass(s) {
  if (s === 'done') return 'agt-job-done';
  if (s === 'failed') return 'agt-job-failed';
  if (s === 'claimed') return 'agt-job-claimed';
  if (s === 'pending') return 'agt-job-pending';
  if (s === 'cancelled') return 'agt-job-cancelled';
  return '';
}

function formatWhen(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function jobPayloadSummary(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.profileUrl) return String(payload.profileUrl);
  if (payload.query) return `query: ${payload.query}`;
  if (payload.connectionId) return `conn ${payload.connectionId}`;
  if (payload.clienteLinkedinId) return `cli ${payload.clienteLinkedinId}`;
  return null;
}

function errMsg(json, res) {
  const m = json?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return `${res.status} ${res.statusText}`;
}

function parseAgentesPayload(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [
    ...(Array.isArray(json?.ativos) ? json.ativos : []),
    ...(Array.isArray(json?.dormindo) ? json.dormindo : []),
    ...(Array.isArray(json?.outros) ? json.outros : []),
  ];
}

function agentFromUrl() {
  return new URLSearchParams(window.location.search).get('agent') || '';
}

function agentFromStorage() {
  try {
    return localStorage.getItem(AGENT_KEY) || '';
  } catch {
    return '';
  }
}

function persistAgent(agentId) {
  try {
    if (agentId) localStorage.setItem(AGENT_KEY, agentId);
    else localStorage.removeItem(AGENT_KEY);
  } catch {
    /* ignore */
  }
}

function syncAgentUrl(agentId) {
  const url = new URL(window.location.href);
  if (agentId) url.searchParams.set('agent', agentId);
  else url.searchParams.delete('agent');
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

export default function Atividades() {
  const [agentes, setAgentes] = useState([]);
  const [agentId, setAgentId] = useState(
    () => agentFromUrl() || agentFromStorage(),
  );
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState(null);

  const agentOpts = useMemo(
    () =>
      agentes
        .slice()
        .sort((a, b) =>
          String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'),
        ),
    [agentes],
  );

  const selected = useMemo(
    () => agentOpts.find((a) => a.id === agentId) || null,
    [agentOpts, agentId],
  );

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    setError(null);
    try {
      const res = await fetch(AGENTES_URL);
      if (!res.ok) throw new Error(`agentes HTTP ${res.status}`);
      const json = await res.json();
      setAgentes(parseAgentesPayload(json));
    } catch (e) {
      setAgentes([]);
      setError(e.message ?? 'Falha ao carregar agentes');
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  const loadJobs = useCallback(async (id, status = '') => {
    if (!id) {
      setJobs([]);
      return;
    }
    setLoadingJobs(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (status) params.set('status', status);
      const res = await fetch(
        `${AGENTE_API_URL}/${encodeURIComponent(id)}/jobs?${params}`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          errMsg(json && typeof json === 'object' ? json : {}, res),
        );
      }
      setJobs(Array.isArray(json) ? json : []);
    } catch (e) {
      setJobs([]);
      setError(e.message ?? 'Falha ao carregar atividade');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (loadingAgents) return;
    if (!agentOpts.length) {
      setAgentId('');
      return;
    }
    if (agentId && agentOpts.some((a) => a.id === agentId)) {
      persistAgent(agentId);
      syncAgentUrl(agentId);
      return;
    }
    const next = agentOpts[0].id;
    setAgentId(next);
    persistAgent(next);
    syncAgentUrl(next);
  }, [loadingAgents, agentOpts, agentId]);

  useEffect(() => {
    if (!agentId) return;
    loadJobs(agentId, statusFilter);
  }, [agentId, statusFilter, loadJobs]);

  function selectAgent(id) {
    setAgentId(id);
    persistAgent(id);
    syncAgentUrl(id);
  }

  return (
    <div className="page page-atividades">
      <BrandBar eyebrow="Jobs dos agentes" />
      <header className="header">
        <div>
          <h1>Atividades</h1>
          <p className="subtitle">
            Timeline de jobs
            {selected ? (
              <>
                {' '}
                — <strong>{selected.nome}</strong>
                <span className="muted"> · {selected.id}</span>
              </>
            ) : (
              ' por agente'
            )}
          </p>
        </div>
        <div className="header-actions">
          <label className="filter funil-agent-filter">
            Agente
            <select
              value={agentId}
              disabled={loadingAgents || !agentOpts.length}
              onChange={(e) => selectAgent(e.target.value)}
              aria-label="Filtrar atividades por agente"
            >
              {!agentOpts.length && (
                <option value="">
                  {loadingAgents ? 'Carregando…' : 'Nenhum agente'}
                </option>
              )}
              {agentOpts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome || a.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-secondary"
            disabled={loadingAgents || loadingJobs || !agentId}
            onClick={() => loadJobs(agentId, statusFilter)}
          >
            Atualizar
          </button>
        </div>
      </header>

      <div className="agt-timeline-filters" role="toolbar" aria-label="Status">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            className={`btn-secondary${
              statusFilter === f.value ? ' agt-filter-on' : ''
            }`}
            disabled={loadingJobs || !agentId}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="error">Erro: {error}</p>}
      {loadingAgents && <p className="muted">Carregando agentes…</p>}
      {!loadingAgents && !agentOpts.length && !error && (
        <p className="empty">Nenhum agente cadastrado.</p>
      )}
      {agentId && loadingJobs && (
        <p className="muted">Carregando atividade…</p>
      )}
      {agentId && !loadingJobs && !jobs.length && !error && (
        <p className="empty">Nenhum job neste filtro.</p>
      )}

      {agentId && !loadingJobs && jobs.length > 0 && (
        <ol className="agt-timeline agt-timeline-page">
          {jobs.map((job) => {
            const when =
              formatWhen(job.completedAt) ||
              formatWhen(job.claimedAt) ||
              formatWhen(job.createdAt);
            const summary = jobPayloadSummary(job.payload);
            return (
              <li key={job.id} className="agt-timeline-item">
                <div className="agt-timeline-dot" aria-hidden />
                <div className="agt-timeline-body">
                  <div className="agt-timeline-head">
                    <span className="agt-timeline-type">
                      {jobTypeLabel(job.type)}
                    </span>
                    <span className={`tag ${jobStatusClass(job.status)}`}>
                      {jobStatusLabel(job.status)}
                    </span>
                    {when ? (
                      <time
                        className="muted"
                        dateTime={
                          job.completedAt || job.claimedAt || job.createdAt
                        }
                      >
                        {when}
                      </time>
                    ) : null}
                  </div>
                  {summary ? (
                    <p className="agt-timeline-summary muted">{summary}</p>
                  ) : null}
                  {job.lastError ? (
                    <p className="agt-timeline-err">{job.lastError}</p>
                  ) : null}
                  <p className="agt-timeline-meta muted">
                    criado {formatWhen(job.createdAt) || '—'}
                    {job.claimedAt
                      ? ` · claim ${formatWhen(job.claimedAt)}`
                      : ''}
                    {job.completedAt
                      ? ` · fim ${formatWhen(job.completedAt)}`
                      : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
