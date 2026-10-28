import { useCallback, useEffect, useState } from 'react';

const SERVIDORES_URL = import.meta.env.VITE_SERVIDORES_URL ?? '/servidores';
const PAGE_SIZE = 50;

const EMPTY_FORM = {
  nome: '',
  provedor: '',
  produto: '',
  hostname: '',
  ipPublico: '',
  ipPrivado: '',
  localhost: false,
  sshUser: 'root',
  sshPort: 22,
  sshPassword: '',
  ramGb: '',
  nestedKvm: false,
  status: 'active',
  notas: '',
};

function statusLabel(s) {
  if (s === 'active') return 'Ativo';
  if (s === 'inactive') return 'Inativo';
  if (s === 'maintenance') return 'Manutenção';
  return s || '—';
}

function toPayload(form) {
  const ram = form.ramGb === '' || form.ramGb == null ? null : Number(form.ramGb);
  const port = Number(form.sshPort) || 22;
  const localhost = Boolean(form.localhost);
  return {
    nome: form.nome.trim(),
    provedor: form.provedor.trim() || (localhost ? 'local' : null),
    produto: form.produto.trim() || null,
    hostname: form.hostname.trim() || (localhost ? 'localhost' : null),
    ipPublico: localhost
      ? form.ipPublico.trim() || '127.0.0.1'
      : form.ipPublico.trim(),
    ipPrivado: localhost ? null : form.ipPrivado.trim() || null,
    localhost,
    sshUser: form.sshUser.trim() || 'root',
    sshPort: port,
    sshPassword: localhost
      ? null
      : form.sshPassword === ''
        ? null
        : form.sshPassword,
    ramGb: Number.isFinite(ram) ? ram : null,
    nestedKvm: Boolean(form.nestedKvm),
    status: form.status || 'active',
    notas: form.notas.trim() || null,
  };
}

function fromRow(row) {
  return {
    nome: row.nome ?? '',
    provedor: row.provedor ?? '',
    produto: row.produto ?? '',
    hostname: row.hostname ?? '',
    ipPublico: row.ipPublico ?? '',
    ipPrivado: row.ipPrivado ?? '',
    localhost: Boolean(row.localhost),
    sshUser: row.sshUser ?? 'root',
    sshPort: row.sshPort ?? 22,
    sshPassword: row.sshPassword ?? '',
    ramGb: row.ramGb ?? '',
    nestedKvm: Boolean(row.nestedKvm),
    status: row.status ?? 'active',
    notas: row.notas ?? '',
  };
}

export default function Servidores() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formNote, setFormNote] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [revealId, setRevealId] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(t);
  }, [q]);

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
        const res = await fetch(`${SERVIDORES_URL}?${params}`);
        if (!res.ok) throw new Error(`servidores HTTP ${res.status}`);
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

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormNote(null);
    setShowPassword(false);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm(fromRow(row));
    setFormNote(null);
    setShowPassword(false);
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
    if (saving) return;
    const payload = toPayload(form);
    if (!payload.nome || (!payload.localhost && !payload.ipPublico)) {
      setFormNote('Nome e IP público são obrigatórios (ou marque Localhost).');
      return;
    }
    setSaving(true);
    setFormNote(null);
    try {
      const url = editingId
        ? `${SERVIDORES_URL}/${editingId}`
        : SERVIDORES_URL;
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message ||
          (Array.isArray(json?.message) ? json.message.join(', ') : null) ||
          `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      closeForm();
      setPage(1);
      await load(1, false);
    } catch (err) {
      setFormNote(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(row) {
    if (!row?.id) return;
    const ok = window.confirm(
      `Remover servidor “${row.nome}” (${row.ipPublico})?`,
    );
    if (!ok) return;
    try {
      const res = await fetch(`${SERVIDORES_URL}/${row.id}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMeta((m) => ({ ...m, total: Math.max(0, (m.total || 1) - 1) }));
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  const hasMore = meta.page < meta.pages;

  return (
    <div className="page page-servidores">
      <header className="page-header">
        <div>
          <h1>Servidores</h1>
          <p className="subtitle">
            Hosts de infra (VPS/VDS) para AVDs e agentes
            {meta.total ? ` · ${meta.total} cadastrado(s)` : ''}
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
          <button type="button" className="btn-primary" onClick={openCreate}>
            Novo servidor
          </button>
        </div>
      </header>

      <div className="emp-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar nome, IP, hostname, provedor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="error">Erro: {error}</p>}
      {loading && page === 1 && <p className="muted">Carregando servidores…</p>}
      {!loading && !rows.length && (
        <p className="empty">Nenhum servidor cadastrado.</p>
      )}

      {rows.length > 0 && (
        <div className="emp-table-wrap">
          <table className="emp-table srv-table">
            <thead>
              <tr>
                <th scope="col">Servidor</th>
                <th scope="col">IP</th>
                <th scope="col">SSH</th>
                <th scope="col">RAM</th>
                <th scope="col">KVM</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="emp-person-text">
                      <span className="emp-person-name">{s.nome}</span>
                      <span className="muted">
                        {[s.provedor, s.produto, s.hostname]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <code className="emp-cnpj">{s.ipPublico}</code>
                    {s.localhost ? (
                      <div className="muted srv-ip-priv">localhost (API)</div>
                    ) : null}
                    {s.ipPrivado ? (
                      <div className="muted srv-ip-priv">
                        Tailscale {s.ipPrivado}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="srv-ssh">
                      {s.localhost ? (
                        <span className="tag usr-status-on">local</span>
                      ) : (
                        <>
                          <code>
                            {s.sshUser}@{s.ipPublico}
                            {s.sshPort && s.sshPort !== 22
                              ? `:${s.sshPort}`
                              : ''}
                          </code>
                          {s.sshPassword ? (
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() =>
                                setRevealId((id) =>
                                  id === s.id ? null : s.id,
                                )
                              }
                            >
                              {revealId === s.id
                                ? 'Ocultar senha'
                                : 'Ver senha'}
                            </button>
                          ) : (
                            <span className="muted">sem senha</span>
                          )}
                          {revealId === s.id && s.sshPassword ? (
                            <code className="srv-pass">{s.sshPassword}</code>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="emp-num">
                    {s.ramGb != null ? `${s.ramGb} GB` : '—'}
                  </td>
                  <td>{s.nestedKvm ? 'Sim' : 'Não'}</td>
                  <td>
                    <span className={`srv-status srv-status-${s.status}`}>
                      {statusLabel(s.status)}
                    </span>
                  </td>
                  <td>
                    <div className="srv-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => openEdit(s)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => removeRow(s)}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            aria-labelledby="srv-modal-title"
          >
            <header className="srv-modal-header">
              <h2 id="srv-modal-title">
                {editingId ? 'Editar servidor' : 'Novo servidor'}
              </h2>
              <button type="button" className="btn-secondary" onClick={closeForm}>
                Fechar
              </button>
            </header>
            <form className="srv-form" onSubmit={submitForm}>
              <label>
                Nome *
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                />
              </label>
              <label>
                Provedor
                <input
                  value={form.provedor}
                  onChange={(e) => setField('provedor', e.target.value)}
                  placeholder="Contabo"
                />
              </label>
              <label>
                Produto
                <input
                  value={form.produto}
                  onChange={(e) => setField('produto', e.target.value)}
                  placeholder="Cloud VDS / Max Performance"
                />
              </label>
              <label>
                Hostname
                <input
                  value={form.hostname}
                  onChange={(e) => setField('hostname', e.target.value)}
                  placeholder="vmi3645369"
                />
              </label>
              <label className="srv-check srv-form-span">
                <input
                  type="checkbox"
                  checked={form.localhost}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      localhost: on,
                      ipPublico: on
                        ? prev.ipPublico || '127.0.0.1'
                        : prev.ipPublico === '127.0.0.1'
                          ? ''
                          : prev.ipPublico,
                      ipPrivado: on ? '' : prev.ipPrivado,
                      hostname: on
                        ? prev.hostname || 'localhost'
                        : prev.hostname === 'localhost'
                          ? ''
                          : prev.hostname,
                      provedor: on
                        ? prev.provedor || 'local'
                        : prev.provedor === 'local'
                          ? ''
                          : prev.provedor,
                      sshPassword: on ? '' : prev.sshPassword,
                    }));
                  }}
                />
                Localhost (máquina da API — sem SSH remoto)
              </label>
              <label>
                IP público {form.localhost ? '' : '*'}
                <input
                  required={!form.localhost}
                  value={form.ipPublico}
                  onChange={(e) => setField('ipPublico', e.target.value)}
                  placeholder={form.localhost ? '127.0.0.1' : '185.250.37.82'}
                  disabled={form.localhost}
                />
              </label>
              <label>
                IP privado / Tailscale
                <input
                  value={form.ipPrivado}
                  onChange={(e) => setField('ipPrivado', e.target.value)}
                  placeholder="100.97.81.69"
                  disabled={form.localhost}
                />
              </label>
              {!form.localhost && (
                <>
                  <label>
                    Usuário SSH
                    <input
                      value={form.sshUser}
                      onChange={(e) => setField('sshUser', e.target.value)}
                    />
                  </label>
                  <label>
                    Porta SSH
                    <input
                      type="number"
                      min={1}
                      max={65535}
                      value={form.sshPort}
                      onChange={(e) => setField('sshPort', e.target.value)}
                    />
                  </label>
                  <label className="srv-form-span">
                    Senha SSH
                    <div className="srv-pass-row">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.sshPassword}
                        onChange={(e) =>
                          setField('sshPassword', e.target.value)
                        }
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </label>
                </>
              )}
              <label>
                RAM (GB)
                <input
                  type="number"
                  min={1}
                  max={1024}
                  value={form.ramGb}
                  onChange={(e) => setField('ramGb', e.target.value)}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="maintenance">Manutenção</option>
                </select>
              </label>
              <label className="srv-check">
                <input
                  type="checkbox"
                  checked={form.nestedKvm}
                  onChange={(e) => setField('nestedKvm', e.target.checked)}
                />
                Nested KVM
              </label>
              <label className="srv-form-span">
                Notas
                <textarea
                  rows={3}
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
                  {saving ? 'Salvando…' : editingId ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
