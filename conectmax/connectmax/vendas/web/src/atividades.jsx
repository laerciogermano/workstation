import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrandBar } from './brand.jsx';

const AGENTES_URL = import.meta.env.VITE_AGENTES_URL ?? '/agentes';
const AGENTE_API_URL = import.meta.env.VITE_AGENTE_URL ?? '/agente';
const AGENT_KEY = 'cx-atividades-agent';

const JOB_TYPE_LABEL = {
  ler_mensagens: 'Ler mensagens',
  verificar_conexoes: 'Ver últimas conexões',
  enviar_prospeccao: 'Enviar prospecção',
  conectar: 'Conectar',
  extrair_leads: 'Buscar candidatos',
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
  if (payload.name) return String(payload.name);
  if (payload.profileUrl) return String(payload.profileUrl);
  if (payload.query) return `query: ${payload.query}`;
  if (payload.connectionId) return `conn ${payload.connectionId}`;
  if (payload.clienteLinkedinId) return `cli ${payload.clienteLinkedinId}`;
  return null;
}

function photoSrc(base64) {
  if (!base64) return null;
  if (String(base64).startsWith('data:')) return base64;
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

function ConnectPerson({ name, photoBase64, profileUrl }) {
  const src = photoSrc(photoBase64);
  const label = name || 'Sem nome';
  return (
    <div className="agt-connect-person">
      {src ? (
        <img className="agt-connect-avatar" src={src} alt="" loading="lazy" />
      ) : (
        <div className="agt-connect-avatar agt-connect-avatar-fallback" aria-hidden>
          {initials(label)}
        </div>
      )}
      <div className="agt-connect-person-text">
        <span className="agt-connect-name">{label}</span>
        {profileUrl ? (
          <a
            className="linkedin-link"
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
          >
            {String(profileUrl).replace(/^https?:\/\/(www\.)?linkedin\.com/i, '')}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function formatDueIn(ms) {
  if (ms == null || !Number.isFinite(ms)) return null;
  if (ms <= 0) return 'agora';
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `em ${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `em ${h} h`;
  return `em ${h} h ${m} min`;
}

function scheduleStateLabel(state) {
  if (state === 'queued') return 'Na fila';
  if (state === 'due') return 'Pode rodar';
  if (state === 'waiting') return 'Agendada';
  if (state === 'blocked') return 'Bloqueada';
  return state || '—';
}

function scheduleStateClass(state) {
  if (state === 'queued' || state === 'due') return 'agt-job-claimed';
  if (state === 'waiting') return 'agt-job-pending';
  if (state === 'blocked') return 'agt-job-cancelled';
  return '';
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
  const [peek, setPeek] = useState(null);
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

  const loadPeek = useCallback(async (id) => {
    if (!id) {
      setPeek(null);
      return;
    }
    try {
      const res = await fetch(
        `${AGENTE_API_URL}/${encodeURIComponent(id)}/peek`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPeek(null);
        return;
      }
      setPeek(json && typeof json === 'object' ? json : null);
    } catch {
      setPeek(null);
    }
  }, []);

  const refresh = useCallback(() => {
    if (!agentId) return;
    loadJobs(agentId, statusFilter);
    loadPeek(agentId);
  }, [agentId, statusFilter, loadJobs, loadPeek]);

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
    if (!agentId) {
      setPeek(null);
      return;
    }
    loadJobs(agentId, statusFilter);
    loadPeek(agentId);
    const t = window.setInterval(() => loadPeek(agentId), 8_000);
    return () => window.clearInterval(t);
  }, [agentId, statusFilter, loadJobs, loadPeek]);

  function selectAgent(id) {
    setAgentId(id);
    persistAgent(id);
    syncAgentUrl(id);
  }

  const nextJob = peek?.next || null;
  const nextConnect = peek?.nextConnect || null;
  const schedule = Array.isArray(peek?.schedule) ? peek.schedule : [];
  const pendingTotal = Array.isArray(peek?.pending)
    ? peek.pending.reduce((n, p) => n + (Number(p.count) || 0), 0)
    : 0;
  const nextSummary = nextJob ? jobPayloadSummary(nextJob.payload) : null;
  const nextSoon =
    schedule.find((s) => s.state === 'queued' || s.state === 'due') ||
    schedule.find((s) => s.state === 'waiting') ||
    null;
  const showConnectPerson =
    nextConnect &&
    ((nextSoon && nextSoon.type === 'conectar') ||
      (!nextSoon && nextJob?.type === 'conectar') ||
      nextConnect.jobStatus === 'claimed');

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
            onClick={refresh}
          >
            Atualizar
          </button>
        </div>
      </header>

      {agentId && (
        <section className="agt-next" aria-label="Próxima atividade">
          <div className="agt-next-head">
            <div className="agt-next-label">Próxima prevista</div>
            <div className="agt-next-meta muted">
              {peek?.online != null
                ? peek.online
                  ? 'agente online'
                  : 'agente offline'
                : null}
              {pendingTotal > 0 ? ` · ${pendingTotal} na fila` : ''}
            </div>
          </div>

          {nextSoon ? (
            <div className="agt-next-body agt-next-highlight">
              <div className="agt-timeline-head">
                <span className="agt-timeline-type">
                  {jobTypeLabel(nextSoon.type)}
                </span>
                <span className={`tag ${scheduleStateClass(nextSoon.state)}`}>
                  {scheduleStateLabel(nextSoon.state)}
                </span>
                {formatDueIn(nextSoon.dueInMs) ? (
                  <strong className="agt-next-when">
                    {formatDueIn(nextSoon.dueInMs)}
                  </strong>
                ) : null}
              </div>
              {showConnectPerson && nextSoon.type === 'conectar' ? (
                <ConnectPerson
                  name={nextConnect.name}
                  photoBase64={nextConnect.photoBase64}
                  profileUrl={nextConnect.profileUrl}
                />
              ) : null}
              {nextSoon.reason ? (
                <p className="agt-timeline-summary muted">{nextSoon.reason}</p>
              ) : null}
              {nextSoon.dueAt && nextSoon.dueInMs > 0 ? (
                <p className="agt-timeline-meta muted">
                  previsto {formatWhen(nextSoon.dueAt)}
                </p>
              ) : null}
            </div>
          ) : nextJob ? (
            <div className="agt-next-body agt-next-highlight">
              <div className="agt-timeline-head">
                <span className="agt-timeline-type">
                  {jobTypeLabel(nextJob.type)}
                </span>
                <span className={`tag ${jobStatusClass(nextJob.status)}`}>
                  {jobStatusLabel(nextJob.status)}
                </span>
                <strong className="agt-next-when">agora</strong>
              </div>
              {showConnectPerson && nextJob.type === 'conectar' ? (
                <ConnectPerson
                  name={nextConnect.name}
                  photoBase64={nextConnect.photoBase64}
                  profileUrl={nextConnect.profileUrl}
                />
              ) : nextSummary ? (
                <p className="agt-timeline-summary muted">{nextSummary}</p>
              ) : null}
            </div>
          ) : (
            <p className="muted agt-next-empty">
              Nenhuma atividade prevista no momento.
            </p>
          )}

          {schedule.length > 0 && (
            <ul className="agt-schedule">
              {schedule.map((item) => (
                <li key={item.type} className="agt-schedule-item">
                  <div className="agt-schedule-main">
                    <span className="agt-schedule-type">
                      {jobTypeLabel(item.type)}
                    </span>
                    <span className={`tag ${scheduleStateClass(item.state)}`}>
                      {scheduleStateLabel(item.state)}
                    </span>
                  </div>
                  <div className="agt-schedule-when">
                    {item.state === 'blocked'
                      ? item.reason || '—'
                      : formatDueIn(item.dueInMs) || item.reason || '—'}
                  </div>
                  {item.state !== 'blocked' && item.reason ? (
                    <p className="agt-timeline-meta muted">{item.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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
            const isConnect = job.type === 'conectar';
            const personName = job.payload?.name || null;
            const personPhoto = job.payload?.photoBase64 || null;
            const personUrl = job.payload?.profileUrl || null;
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
                  {isConnect && (personName || personPhoto || personUrl) ? (
                    <ConnectPerson
                      name={personName}
                      photoBase64={personPhoto}
                      profileUrl={personUrl}
                    />
                  ) : summary ? (
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
