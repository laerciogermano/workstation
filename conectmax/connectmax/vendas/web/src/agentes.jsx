import { useCallback, useEffect, useMemo, useState } from 'react';
import { hasPermission } from './auth.js';

const AGENTES_URL = import.meta.env.VITE_AGENTES_URL ?? '/agentes';

const EMPTY_FORM = {
  nome: '',
  copyHostFromAgenteId: '',
  hostNome: '',
  fromBackup: '',
  adbPort: '',
  start: true,
  provisionDevice: true,
  notas: '',
  linkedinNome: '',
  linkedinUsuario: '',
  linkedinProfileUrl: '',
  linkedinHeadline: '',
};

function statusLabel(s) {
  if (s === 'ativo') return 'Ativo';
  if (s === 'dormindo') return 'Dormindo';
  if (s === 'criando') return 'Criando';
  if (s === 'erro') return 'Erro';
  return s || '—';
}

function errMsg(json, res) {
  const m = json?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return `${res.status} ${res.statusText}`;
}

function hostLabel(a) {
  if (!a) return '—';
  const name = a.hostNome || a.nome || '—';
  if (a.localhost) return `${name} · localhost`;
  return `${name} · ${a.ipPublico || a.ipPrivado || '—'}`;
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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const allRows = useMemo(
    () => [...ativos, ...dormindo, ...outros],
    [ativos, dormindo, outros],
  );

  const load = useCallback(
    async (opts = {}) => {
      const doSync = Boolean(opts.sync);
      if (doSync) setSyncing(true);
      else setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ grouped: 'true' });
        if (doSync) params.set('sync', 'true');
        if (debouncedQ) params.set('q', debouncedQ);
        const res = await fetch(`${AGENTES_URL}?${params}`);
        if (!res.ok) throw new Error(`agentes HTTP ${res.status}`);
        const json = await res.json();
        setAtivos(Array.isArray(json.ativos) ? json.ativos : []);
        setDormindo(Array.isArray(json.dormindo) ? json.dormindo : []);
        setOutros(Array.isArray(json.outros) ? json.outros : []);
        setMeta({
          total: json.meta?.total ?? 0,
          ativos: json.meta?.ativos ?? 0,
          dormindo: json.meta?.dormindo ?? 0,
        });
      } catch (e) {
        setError(e.message ?? 'Falha ao carregar');
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [debouncedQ],
  );

  useEffect(() => {
    load({ sync: false });
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      copyHostFromAgenteId: allRows[0]?.id ?? '',
    });
    setFormNote(null);
    setFormOpen(true);
  }

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
    if (saving || !canWrite) return;
    setSaving(true);
    setFormNote(null);
    try {
      if (editingId) {
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
        await load({ sync: false });
        return;
      }

      const nome = form.nome.trim();
      if (!nome) {
        setFormNote('Nome é obrigatório.');
        setSaving(false);
        return;
      }
      const payload = {
        nome,
        start: Boolean(form.start),
        provisionDevice: Boolean(form.provisionDevice),
        notas: form.notas.trim() || null,
      };
      if (form.copyHostFromAgenteId) {
        payload.copyHostFromAgenteId = form.copyHostFromAgenteId;
      } else {
        if (!form.hostNome.trim()) {
          setFormNote('Host: informe hostNome ou copie de outro agente.');
          setSaving(false);
          return;
        }
        payload.hostNome = form.hostNome.trim();
        // Sem IP/localhost na UI: host novo = máquina da API.
        payload.localhost = true;
      }
      if (form.fromBackup.trim()) payload.fromBackup = form.fromBackup.trim();
      const adb = Number(form.adbPort);
      if (Number.isFinite(adb) && adb >= 1 && adb <= 65535) {
        payload.adbPort = adb;
      }
      if (form.linkedinNome.trim()) {
        payload.linkedinNome = form.linkedinNome.trim();
      }
      if (form.linkedinUsuario.trim()) {
        payload.linkedinUsuario = form.linkedinUsuario.trim();
      }
      if (form.linkedinProfileUrl.trim()) {
        payload.linkedinProfileUrl = form.linkedinProfileUrl.trim();
      }
      if (form.linkedinHeadline.trim()) {
        payload.linkedinHeadline = form.linkedinHeadline.trim();
      }
      const res = await fetch(AGENTES_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      closeForm();
      setNote(`Agente “${nome}” criado.`);
      await load({ sync: false });
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
        await load({ sync: false });
        return;
      }
      if (action !== 'wake') return;
      const res = await fetch(`${AGENTES_URL}/${row.id}/wake`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      setNote(`Acordar · ${row.nome}`);
      await load({ sync: false });
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setBusyId(null);
    }
  }

  function renderTable(rows, title) {
    if (!rows.length) return null;
    return (
      <section className="avd-section">
        <h2>
          {title}{' '}
          <span className="muted">({rows.length})</span>
        </h2>
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Agente</th>
                <th>Host</th>
                <th>LinkedIn</th>
                <th>ADB</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
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
                  <td className="muted">{hostLabel(a)}</td>
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
                  </td>
                  <td>
                    {canWrite && (
                      <div className="usr-actions">
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
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="page page-agentes">
      <header className="page-header">
        <div>
          <h1>Agentes</h1>
          <p className="subtitle">
            Vendedor = host + device + LinkedIn
            {meta.total
              ? ` · ${meta.total} (${meta.ativos} ativos / ${meta.dormindo} dormindo)`
              : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading || syncing}
            onClick={() => load({ sync: true })}
          >
            {syncing ? 'Sincronizando…' : 'Sync Docker'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => load({ sync: false })}
          >
            Atualizar
          </button>
          {canWrite && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              Novo agente
            </button>
          )}
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
        <p className="empty">Nenhum agente. Gestores podem cadastrar aqui.</p>
      )}

      {renderTable(ativos, 'Ativos')}
      {renderTable(dormindo, 'Dormindo')}
      {renderTable(outros, 'Outros')}

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
              <h2 id="agt-modal-title">
                {editingId ? `Editar ${form.nome || 'agente'}` : 'Novo agente'}
              </h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Fechar
              </button>
            </header>
            <form className="srv-form" onSubmit={submitForm}>
              {editingId && (
                <label className="srv-form-span">
                  Id
                  <input value={editingId} disabled readOnly />
                </label>
              )}
              <label>
                Nome *
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                  placeholder="agent-d"
                />
              </label>
              {!editingId && (
                <label className="srv-form-span">
                  Copiar host de
                  <select
                    value={form.copyHostFromAgenteId}
                    onChange={(e) =>
                      setField('copyHostFromAgenteId', e.target.value)
                    }
                  >
                    <option value="">— novo host —</option>
                    {allRows.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome} · {a.id.slice(0, 8)} · {hostLabel(a)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {(editingId || !form.copyHostFromAgenteId) && (
                <label>
                  Nome do host *
                  <input
                    required={Boolean(editingId) || !form.copyHostFromAgenteId}
                    value={form.hostNome}
                    onChange={(e) => setField('hostNome', e.target.value)}
                  />
                </label>
              )}
              {!editingId && (
                <>
                  <label>
                    Porta ADB (opcional)
                    <input
                      value={form.adbPort}
                      onChange={(e) => setField('adbPort', e.target.value)}
                    />
                  </label>
                  <label className="srv-form-span">
                    From backup (path no host)
                    <input
                      value={form.fromBackup}
                      onChange={(e) => setField('fromBackup', e.target.value)}
                    />
                  </label>
                  <label className="srv-check srv-form-span">
                    <input
                      type="checkbox"
                      checked={form.provisionDevice}
                      onChange={(e) =>
                        setField('provisionDevice', e.target.checked)
                      }
                    />
                    Provisionar container Docker
                  </label>
                  <label className="srv-check srv-form-span">
                    <input
                      type="checkbox"
                      checked={form.start}
                      disabled={!form.provisionDevice}
                      onChange={(e) => setField('start', e.target.checked)}
                    />
                    Subir container após criar
                  </label>
                </>
              )}
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
                  {saving
                    ? 'Salvando…'
                    : editingId
                      ? 'Salvar'
                      : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
