import { useCallback, useEffect, useMemo, useState } from 'react';
import { hasPermission } from './auth.js';

const AGENTES_URL = import.meta.env.VITE_AGENTES_URL ?? '/agentes';
const SLOTS_URL = import.meta.env.VITE_AGENTE_SLOTS_URL ?? '/agente/slots';
const AGENTE_API_URL =
  import.meta.env.VITE_AGENTE_URL ??
  (SLOTS_URL.endsWith('/slots')
    ? SLOTS_URL.slice(0, -'/slots'.length)
    : '/agente');

const EMPTY_FORM = {
  nome: '',
  hostNome: '',
  notas: '',
  linkedinNome: '',
  linkedinUsuario: '',
  linkedinProfileUrl: '',
  linkedinHeadline: '',
};

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

function statusLabel(s) {
  if (s === 'ativo') return 'Ativo';
  if (s === 'dormindo') return 'Dormindo';
  if (s === 'criando') return 'Criando';
  if (s === 'erro') return 'Erro';
  return s || '—';
}

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
  const bits = [];
  if (payload.profileUrl) bits.push(String(payload.profileUrl));
  else if (payload.query) bits.push(`query: ${payload.query}`);
  else if (payload.connectionId) bits.push(`conn ${payload.connectionId}`);
  else if (payload.clienteLinkedinId) {
    bits.push(`cli ${payload.clienteLinkedinId}`);
  }
  return bits.length ? bits.join(' · ') : null;
}

/** Alinha com api `hostKey()` — localhost ou IP. */
function agentHostKey(a) {
  if (!a) return '—';
  if (a.localhost) return 'localhost';
  return String(a.ipPrivado || a.ipPublico || a.id || '').trim() || '—';
}

function slotContextLabel(a, pendingJobs) {
  if (a?.status === 'ativo') return 'no slot';
  if (a?.status === 'dormindo' && pendingJobs > 0) {
    return 'fila de alternância';
  }
  if (a?.status === 'dormindo') return 'parado';
  return null;
}

function errMsg(json, res) {
  const m = json?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return `${res.status} ${res.statusText}`;
}

function liLabel(a) {
  if (!a?.linkedinUsuario && !a?.linkedinNome) return '—';
  const name = a.linkedinNome || 'LI';
  return a.linkedinUsuario ? `${name} <${a.linkedinUsuario}>` : name;
}

function needsLinkedin(a) {
  return !String(a?.linkedinUsuario || '').trim();
}

export default function Agentes() {
  const canWrite = hasPermission('agentes:write');
  const [ativos, setAtivos] = useState([]);
  const [dormindo, setDormindo] = useState([]);
  const [outros, setOutros] = useState([]);
  const [meta, setMeta] = useState({ total: 0, ativos: 0, dormindo: 0 });
  const [slotsMeta, setSlotsMeta] = useState({ maxAtivos: 4, hosts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formNote, setFormNote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slotDraft, setSlotDraft] = useState({});
  const [slotBusyKey, setSlotBusyKey] = useState(null);
  const [timelineAgent, setTimelineAgent] = useState(null);
  const [timelineJobs, setTimelineJobs] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [timelineFilter, setTimelineFilter] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const allRows = useMemo(
    () => [...ativos, ...dormindo, ...outros],
    [ativos, dormindo, outros],
  );

  /** agentId → pendingJobs (de /agente/slots). */
  const pendingByAgentId = useMemo(() => {
    const map = new Map();
    for (const h of slotsMeta.hosts || []) {
      for (const list of [
        h.agentesAtivos,
        h.candidatosWake,
        h.candidatosSleep,
      ]) {
        for (const a of list || []) {
          const id = a.id || a.agentId;
          if (id) map.set(id, Number(a.pendingJobs) || 0);
        }
      }
    }
    return map;
  }, [slotsMeta]);

  const hostSections = useMemo(() => {
    const byKey = new Map();
    for (const a of allRows) {
      const key = agentHostKey(a);
      if (!byKey.has(key)) {
        byKey.set(key, {
          hostKey: key,
          hostNome: a.hostNome || key,
          agents: [],
        });
      }
      const g = byKey.get(key);
      g.agents.push(a);
      if (a.hostNome) g.hostNome = a.hostNome;
    }
    const slotByKey = new Map(
      (slotsMeta.hosts || []).map((h) => [h.hostKey, h]),
    );
    const defaultMax = Number(slotsMeta.maxAtivos) || 4;
    const sections = [...byKey.values()].map((g) => {
      const slot = slotByKey.get(g.hostKey);
      const maxAtivos = Number(slot?.maxAtivos) || defaultMax;
      const ativosN =
        slot?.ativos ?? g.agents.filter((a) => a.status === 'ativo').length;
      const dormindoN =
        slot?.dormindo ??
        g.agents.filter((a) => a.status === 'dormindo').length;
      const ramGb =
        g.agents.map((a) => a.ramGb).find((n) => n != null) ?? null;
      const diskGb =
        g.agents.map((a) => a.diskGb).find((n) => n != null) ?? null;
      return {
        hostKey: g.hostKey,
        hostNome: slot?.hostNome || g.hostNome,
        maxAtivos,
        ativos: ativosN,
        dormindo: dormindoN,
        livres: slot?.livres ?? Math.max(0, maxAtivos - ativosN),
        ramGb,
        diskGb,
        agents: g.agents.slice().sort((a, b) => {
          const rank = (s) =>
            s === 'ativo' ? 0 : s === 'dormindo' ? 1 : 2;
          return (
            rank(a.status) - rank(b.status) ||
            String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
          );
        }),
      };
    });
    sections.sort((a, b) =>
      a.hostKey === 'localhost'
        ? -1
        : b.hostKey === 'localhost'
          ? 1
          : a.hostNome.localeCompare(b.hostNome, 'pt-BR'),
    );
    return sections;
  }, [allRows, slotsMeta]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ grouped: 'true' });
      if (debouncedQ) params.set('q', debouncedQ);
      const [resAg, resSlots] = await Promise.all([
        fetch(`${AGENTES_URL}?${params}`),
        fetch(SLOTS_URL),
      ]);
      if (!resAg.ok) throw new Error(`agentes HTTP ${resAg.status}`);
      const json = await resAg.json();
      setAtivos(Array.isArray(json.ativos) ? json.ativos : []);
      setDormindo(Array.isArray(json.dormindo) ? json.dormindo : []);
      setOutros(Array.isArray(json.outros) ? json.outros : []);
      setMeta({
        total: json.meta?.total ?? 0,
        ativos: json.meta?.ativos ?? 0,
        dormindo: json.meta?.dormindo ?? 0,
      });
      if (resSlots.ok) {
        const slotsJson = await resSlots.json();
        setSlotsMeta({
          maxAtivos: Number(slotsJson.maxAtivos) || 4,
          hosts: Array.isArray(slotsJson.hosts) ? slotsJson.hosts : [],
        });
      } else {
        setSlotsMeta({ maxAtivos: 4, hosts: [] });
      }
    } catch (e) {
      setError(e.message ?? 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      ...EMPTY_FORM,
      nome: row.nome || '',
      hostNome: row.hostNome || '',
      notas: row.notas || '',
      linkedinNome: row.linkedinNome || '',
      linkedinUsuario: row.linkedinUsuario || '',
      linkedinProfileUrl: row.linkedinProfileUrl || '',
      linkedinHeadline: row.linkedinHeadline || '',
    });
    setFormNote(null);
    setFormOpen(true);
  }

  const loadTimeline = useCallback(async (agent, status = '') => {
    if (!agent?.id) return;
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (status) params.set('status', status);
      const res = await fetch(
        `${AGENTE_API_URL}/${encodeURIComponent(agent.id)}/jobs?${params}`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          errMsg(json && typeof json === 'object' ? json : {}, res),
        );
      }
      setTimelineJobs(Array.isArray(json) ? json : []);
    } catch (e) {
      setTimelineJobs([]);
      setTimelineError(e.message ?? 'Falha ao carregar atividade');
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  function openTimeline(row) {
    setTimelineAgent(row);
    setTimelineFilter('');
    setTimelineJobs([]);
    setTimelineError(null);
    loadTimeline(row, '');
  }

  function closeTimeline() {
    setTimelineAgent(null);
    setTimelineJobs([]);
    setTimelineError(null);
    setTimelineFilter('');
    setTimelineLoading(false);
  }

  function changeTimelineFilter(status) {
    setTimelineFilter(status);
    if (timelineAgent) loadTimeline(timelineAgent, status);
  }

  async function saveHostSlots(hostKey, maxAtivosRaw) {
    if (!canWrite || !hostKey) return;
    const maxAtivos = Math.min(
      64,
      Math.max(1, Math.floor(Number(maxAtivosRaw)) || 1),
    );
    setSlotBusyKey(hostKey);
    setNote(null);
    try {
      const res = await fetch(
        `${SLOTS_URL.replace(/\/slots$/, '')}/hosts/${encodeURIComponent(hostKey)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ maxAtivos }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      setNote(`Slots de ${hostKey}: máx. ${maxAtivos}`);
      setSlotDraft((prev) => {
        const next = { ...prev };
        delete next[hostKey];
        return next;
      });
      await load();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSlotBusyKey(null);
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormNote(null);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitForm(e) {
    e.preventDefault();
    if (saving || !canWrite || !editingId) return;
    setSaving(true);
    setFormNote(null);
    try {
      const nome = form.nome.trim();
      if (!nome) {
        setFormNote('Nome é obrigatório.');
        setSaving(false);
        return;
      }
      if (!form.hostNome.trim()) {
        setFormNote('Host: informe hostNome.');
        setSaving(false);
        return;
      }
      const payload = {
        nome,
        hostNome: form.hostNome.trim(),
        notas: form.notas.trim() || null,
        linkedinNome: form.linkedinNome.trim() || null,
        linkedinUsuario: form.linkedinUsuario.trim() || null,
        linkedinProfileUrl: form.linkedinProfileUrl.trim() || null,
        linkedinHeadline: form.linkedinHeadline.trim() || null,
      };
      const res = await fetch(`${AGENTES_URL}/${editingId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      closeForm();
      setNote(`Agente “${form.nome || editingId}” atualizado.`);
      await load();
    } catch (err) {
      setFormNote(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(row, action) {
    if (!row?.id || !canWrite) return;
    if (busyId === row.id) return;
    if (action === 'remove') {
      if (
        !window.confirm(
          `Remover agente “${row.nome}”? O container será apagado no host.`,
        )
      ) {
        return;
      }
    }
    setBusyId(row.id);
    setNote(null);
    try {
      if (action === 'remove') {
        const res = await fetch(`${AGENTES_URL}/${row.id}`, {
          method: 'DELETE',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(errMsg(json, res));
        setNote(`Removido ${row.nome}.`);
        await load();
        return;
      }
      if (action !== 'wake') return;
      const res = await fetch(`${AGENTES_URL}/${row.id}/wake`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      setNote(`Acordar · ${row.nome}`);
      await load();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setBusyId(null);
    }
  }

  function renderHostSection(host) {
    const rows = host.agents;
    if (!rows.length) return null;
    const draftMax =
      slotDraft[host.hostKey] != null
        ? slotDraft[host.hostKey]
        : String(host.maxAtivos);
    const specs =
      [
        host.ramGb != null ? `RAM ${host.ramGb} GB` : null,
        host.diskGb != null ? `Disco ${host.diskGb} GB` : null,
      ]
        .filter(Boolean)
        .join(' · ') || '—';
    return (
      <div key={host.hostKey} className="host-block">
        <section className="avd-section">
          <h2 className="avd-section-title">Host</h2>
          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Máquina</th>
                  <th>Recursos</th>
                  <th>Slots</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="emp-person-text">
                      <span className="emp-person-name">{host.hostNome}</span>
                      <span className="muted">{host.hostKey}</span>
                    </div>
                  </td>
                  <td className="muted" title="Reportado pelo worker no enroll">
                    {specs}
                  </td>
                  <td>
                    <span className="tag">
                      {host.ativos}/{host.maxAtivos}
                    </span>
                    <span className="muted">
                      {host.livres ? ` · ${host.livres} livre` : ''}
                      {` · ${rows.length} agente${rows.length === 1 ? '' : 's'}`}
                      {` · ${host.dormindo} dormindo`}
                    </span>
                  </td>
                  <td>
                    {canWrite ? (
                      <div className="usr-actions host-slots-edit">
                        <input
                          type="number"
                          min={1}
                          max={64}
                          aria-label="Máx. slots"
                          value={draftMax}
                          disabled={slotBusyKey === host.hostKey}
                          onChange={(e) =>
                            setSlotDraft((prev) => ({
                              ...prev,
                              [host.hostKey]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={
                            slotBusyKey === host.hostKey ||
                            String(draftMax) === String(host.maxAtivos)
                          }
                          onClick={() => saveHostSlots(host.hostKey, draftMax)}
                        >
                          Salvar slots
                        </button>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="avd-section">
          <h2 className="avd-section-title">
            Agentes{' '}
            <span className="muted">({rows.length})</span>
          </h2>
          <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Agente</th>
                <th>LinkedIn</th>
                <th>ADB</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const pending = pendingByAgentId.get(a.id) || 0;
                const ctx = slotContextLabel(a, pending);
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="emp-person-text">
                        <span className="emp-person-name">{a.nome}</span>
                        <span className="muted" title={a.id}>
                          {a.id}
                        </span>
                        {a.containerName ? (
                          <span className="muted">{a.containerName}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="muted">
                      {needsLinkedin(a) ? (
                        <span
                          className="tag tag-warn"
                          title="Complete usuário no editar"
                        >
                          falta LinkedIn
                        </span>
                      ) : (
                        <div className="emp-person-text">
                          <span>{liLabel(a)}</span>
                          {a.linkedinProfileUrl &&
                          !/\/in\/me\/?$/i.test(a.linkedinProfileUrl) ? (
                            <a
                              className="linkedin-link"
                              href={a.linkedinProfileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {a.linkedinProfileUrl.replace(
                                /^https?:\/\/(www\.)?linkedin\.com/i,
                                '',
                              )}
                            </a>
                          ) : null}
                        </div>
                      )}
                      {!needsLinkedin(a) &&
                      a.linkedinStatus &&
                      a.linkedinStatus !== 'ativa' ? (
                        <div className="tag">{a.linkedinStatus}</div>
                      ) : null}
                    </td>
                    <td className="muted">{a.serial || `:${a.adbPort}`}</td>
                    <td>
                      <span className="tag">{statusLabel(a.status)}</span>
                      {ctx ? (
                        <span
                          className={`tag ${
                            a.status === 'ativo'
                              ? 'usr-status-on'
                              : pending > 0
                                ? 'tag-warn'
                                : ''
                          }`}
                          title={
                            pending > 0 ? `${pending} job(s) pending` : undefined
                          }
                        >
                          {ctx}
                          {pending > 0 ? ` · ${pending} jobs` : ''}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <div className="usr-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openTimeline(a)}
                        >
                          Atividade
                        </button>
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => openEdit(a)}
                            >
                              Editar
                            </button>
                            {a.status !== 'ativo' && (
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={busyId === a.id}
                                onClick={() => runAction(a, 'wake')}
                              >
                                Acordar
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={busyId === a.id}
                              onClick={() => runAction(a, 'remove')}
                            >
                              Remover
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page page-agentes">
      <header className="page-header">
        <div>
          <h1>Agentes</h1>
          <p className="subtitle">
            Hosts (slots/máq.) e agentes · RAM/disco só do worker
            {meta.total
              ? ` · ${hostSections.length} host${
                  hostSections.length === 1 ? '' : 's'
                } · ${meta.total} agente${meta.total === 1 ? '' : 's'} (${
                  meta.ativos
                } no slot / ${meta.dormindo} dormindo) · máx. ${
                  slotsMeta.maxAtivos
                } ativo${slotsMeta.maxAtivos === 1 ? '' : 's'}/host`
              : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => load()}
          >
            Atualizar
          </button>
        </div>
      </header>

      <div className="emp-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar nome, host, IP, LinkedIn…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {note && <p className="muted">{note}</p>}
      {error && <p className="error">Erro: {error}</p>}
      {loading && <p className="muted">Carregando agentes…</p>}
      {!loading && !meta.total && (
        <p className="empty">Nenhum agente. Novos entram via enroll do worker.</p>
      )}

      {!loading && hostSections.map((h) => renderHostSection(h))}

      {timelineAgent && (
        <div
          className="srv-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTimeline();
          }}
        >
          <div
            className="srv-modal agt-timeline-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agt-timeline-title"
          >
            <header className="srv-modal-header">
              <div>
                <h2 id="agt-timeline-title">
                  Atividade · {timelineAgent.nome || timelineAgent.id}
                </h2>
                <p className="muted agt-timeline-sub">
                  Histórico de jobs · {timelineAgent.id}
                </p>
              </div>
              <div className="usr-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={timelineLoading}
                  onClick={() =>
                    loadTimeline(timelineAgent, timelineFilter)
                  }
                >
                  Atualizar
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeTimeline}
                >
                  Fechar
                </button>
              </div>
            </header>

            <div className="agt-timeline-filters">
              {[
                { value: '', label: 'Todos' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'claimed', label: 'Em execução' },
                { value: 'done', label: 'Concluídos' },
                { value: 'failed', label: 'Falhas' },
                { value: 'cancelled', label: 'Cancelados' },
              ].map((f) => (
                <button
                  key={f.value || 'all'}
                  type="button"
                  className={`btn-secondary${
                    timelineFilter === f.value ? ' agt-filter-on' : ''
                  }`}
                  disabled={timelineLoading}
                  onClick={() => changeTimelineFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {timelineError && <p className="error">Erro: {timelineError}</p>}
            {timelineLoading && (
              <p className="muted">Carregando atividade…</p>
            )}
            {!timelineLoading && !timelineJobs.length && !timelineError && (
              <p className="empty">Nenhum job neste filtro.</p>
            )}

            {!timelineLoading && timelineJobs.length > 0 && (
              <ol className="agt-timeline">
                {timelineJobs.map((job) => {
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
                          <span
                            className={`tag ${jobStatusClass(job.status)}`}
                          >
                            {jobStatusLabel(job.status)}
                          </span>
                          {when ? (
                            <time
                              className="muted"
                              dateTime={
                                job.completedAt ||
                                job.claimedAt ||
                                job.createdAt
                              }
                            >
                              {when}
                            </time>
                          ) : null}
                        </div>
                        {summary ? (
                          <p className="agt-timeline-summary muted">
                            {summary}
                          </p>
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
        </div>
      )}

      {formOpen && (
        <div
          className="srv-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div
            className="srv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agt-modal-title"
          >
            <header className="srv-modal-header">
              <h2 id="agt-modal-title">Editar {form.nome || 'agente'}</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Fechar
              </button>
            </header>
            <form className="srv-form" onSubmit={submitForm}>
              <label className="srv-form-span">
                Id
                <input value={editingId || ''} disabled readOnly />
              </label>
              <label>
                Nome *
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                  placeholder="agent-d"
                />
              </label>
              <label>
                Nome do host *
                <input
                  required
                  value={form.hostNome}
                  onChange={(e) => setField('hostNome', e.target.value)}
                />
              </label>
              <p className="muted srv-form-span">
                RAM e disco vêm do worker no enroll (não editáveis aqui).
              </p>
              <p className="muted srv-form-span">LinkedIn</p>
              <label>
                Nome perfil
                <input
                  value={form.linkedinNome}
                  onChange={(e) => setField('linkedinNome', e.target.value)}
                />
              </label>
              <label>
                E-mail / login
                <input
                  value={form.linkedinUsuario}
                  onChange={(e) => setField('linkedinUsuario', e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                Profile URL
                <input
                  value={form.linkedinProfileUrl}
                  onChange={(e) =>
                    setField('linkedinProfileUrl', e.target.value)
                  }
                  placeholder="https://www.linkedin.com/in/slug/"
                />
              </label>
              <label>
                Headline
                <input
                  value={form.linkedinHeadline}
                  onChange={(e) => setField('linkedinHeadline', e.target.value)}
                />
              </label>
              <label className="srv-form-span">
                Notas
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={(e) => setField('notas', e.target.value)}
                />
              </label>
              {formNote && <p className="error srv-form-span">{formNote}</p>}
              <div className="srv-form-actions srv-form-span">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
