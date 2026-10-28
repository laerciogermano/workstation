import { useCallback, useEffect, useState } from 'react';
import { hasPermission } from './auth.js';

const GESTORES_URL = import.meta.env.VITE_GESTORES_URL ?? '/gestores';
const PAGE_SIZE = 50;

function errMsg(json, res) {
  const m = json?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return `${res.status} ${res.statusText}`;
}

function agentIdsOf(row) {
  if (!row?.agentes?.length) return [];
  return row.agentes.map((a) => a.agentId).filter(Boolean);
}

/**
 * Lista usuários com role=gestor e permite vincular agentes (PUT /gestores/:id/agentes).
 * Cadastro do usuário: /usuarios (marcar role gestor).
 */
export default function Gestores() {
  const canWrite = hasPermission('gestores:write');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [agenteOpts, setAgenteOpts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formNome, setFormNome] = useState('');
  const [agentIds, setAgentIds] = useState([]);
  const [formNote, setFormNote] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadAgenteOpts = useCallback(async () => {
    try {
      const res = await fetch(`${GESTORES_URL}/agentes`);
      if (!res.ok) return;
      const json = await res.json();
      setAgenteOpts(Array.isArray(json.data) ? json.data : []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(PAGE_SIZE),
        });
        if (debouncedQ) params.set('q', debouncedQ);
        const res = await fetch(`${GESTORES_URL}?${params}`);
        if (!res.ok) throw new Error(`gestores HTTP ${res.status}`);
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        setMeta({
          total: json.meta?.total ?? data.length,
          page: json.meta?.page ?? pageNum,
          pages: json.meta?.pages ?? 1,
        });
        setRows((prev) => {
          if (!append || pageNum <= 1) return data;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...data.filter((r) => r.id && !seen.has(r.id))];
        });
      } catch (e) {
        setError(e.message ?? 'Falha ao carregar');
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ],
  );

  useEffect(() => {
    load(page, page > 1);
  }, [load, page]);

  useEffect(() => {
    loadAgenteOpts();
  }, [loadAgenteOpts]);

  function openEdit(row) {
    setEditingId(row.id);
    setFormNome(row.nome ?? '');
    setAgentIds(agentIdsOf(row));
    setFormNote(null);
    setFormOpen(true);
    loadAgenteOpts();
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setAgentIds([]);
    setFormNote(null);
  }

  function toggleAgent(agentId) {
    setAgentIds((prev) => {
      const set = new Set(prev);
      if (set.has(agentId)) set.delete(agentId);
      else set.add(agentId);
      return [...set];
    });
  }

  async function submitForm(e) {
    e.preventDefault();
    if (saving || !canWrite || !editingId) return;
    setSaving(true);
    setFormNote(null);
    try {
      const res = await fetch(`${GESTORES_URL}/${editingId}/agentes`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agentIds }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      closeForm();
      setPage(1);
      await Promise.all([load(1, false), loadAgenteOpts()]);
    } catch (err) {
      setFormNote(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  const agentesDisponiveis = agenteOpts.filter(
    (a) =>
      !a.gestorId ||
      a.gestorId === editingId ||
      agentIds.includes(a.agentId),
  );
  const hasMore = meta.page < meta.pages;

  return (
    <div className="page page-gestores">
      <header className="page-header">
        <div>
          <h1>Gestores de vendas</h1>
          <p className="subtitle">
            Usuários com role <code>gestor</code> · 1 gestor → N agentes
            {meta.total ? ` · ${meta.total}` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => load(1, false)}
            disabled={loading}
          >
            Atualizar
          </button>
        </div>
      </header>

      <p className="muted">
        Para criar gestor: em Usuários, marque a role <strong>gestor</strong>{' '}
        (pode combinar com admin/dev).
      </p>

      <div className="emp-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar nome, e-mail, agente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="error">Erro: {error}</p>}
      {loading && page === 1 && (
        <p className="muted">Carregando gestores…</p>
      )}
      {!loading && !rows.length && (
        <p className="empty">Nenhum usuário com role gestor.</p>
      )}

      {rows.length > 0 && (
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th scope="col">Gestor</th>
                <th scope="col">E-mail</th>
                <th scope="col">Agentes</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const ids = agentIdsOf(g);
                return (
                  <tr key={g.id}>
                    <td>
                      <span className="emp-person-name">{g.nome}</span>
                    </td>
                    <td className="muted">{g.email || '—'}</td>
                    <td>
                      {ids.length ? (
                        <div className="gest-agents">
                          {ids.map((id) => (
                            <span key={id} className="tag">
                              {id}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`tag ${
                          g.active ? 'usr-status-on' : 'usr-status-off'
                        }`}
                      >
                        {g.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {canWrite && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openEdit(g)}
                        >
                          Agentes
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="emp-more">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {loading ? 'Carregando…' : 'Carregar mais'}
          </button>
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
            aria-labelledby="gst-modal-title"
          >
            <header className="srv-modal-header">
              <h2 id="gst-modal-title">Agentes de {formNome}</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Fechar
              </button>
            </header>
            <form className="srv-form" onSubmit={submitForm}>
              <fieldset className="srv-form-span gest-agents-field">
                <legend>Agentes</legend>
                {!agentesDisponiveis.length ? (
                  <p className="muted">Nenhum agente cadastrado em /agentes.</p>
                ) : (
                  <div className="gest-agents-check">
                    {agentesDisponiveis.map((a) => (
                      <label key={a.agentId} className="gest-agent-opt">
                        <input
                          type="checkbox"
                          checked={agentIds.includes(a.agentId)}
                          onChange={() => toggleAgent(a.agentId)}
                        />
                        <span>
                          {a.agentId}
                          {a.hostNome ? (
                            <span className="muted"> · {a.hostNome}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
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
                  {saving ? 'Salvando…' : 'Salvar agentes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
