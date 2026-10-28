import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUser, hasPermission } from './auth.js';

const USERS_URL = import.meta.env.VITE_USERS_URL ?? '/users';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'dev', label: 'Dev' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'operador', label: 'Operador' },
  { value: 'viewer', label: 'Viewer' },
];

const EMPTY_FORM = {
  email: '',
  nome: '',
  password: '',
  roles: ['operador'],
  active: true,
};

function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label ?? role ?? '—';
}

function rolesOf(user) {
  if (Array.isArray(user?.roles) && user.roles.length) return user.roles;
  if (user?.role) return [user.role];
  return [];
}

function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function errMessage(json, res) {
  const msg = json?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  return `${res.status} ${res.statusText}`;
}

export default function Usuarios() {
  const me = getUser();
  const canWrite = hasPermission('users:write');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formNote, setFormNote] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(USERS_URL);
      if (res.status === 403) {
        throw new Error('Sem permissão para gerenciar usuários (só admin).');
      }
      if (!res.ok) throw new Error(`users HTTP ${res.status}`);
      const json = await res.json();
      setRows(Array.isArray(json) ? json : []);
    } catch (e) {
      setError(e.message ?? 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((u) => {
      const blob = `${u.nome || ''} ${u.email || ''} ${rolesOf(u).join(' ')}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormNote(null);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      email: row.email ?? '',
      nome: row.nome ?? '',
      password: '',
      roles: rolesOf(row),
      active: row.active !== false,
    });
    setFormNote(null);
    setFormOpen(true);
  }

  function toggleRole(value) {
    setForm((prev) => {
      const set = new Set(prev.roles || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      const roles = ROLES.map((r) => r.value).filter((v) => set.has(v));
      return { ...prev, roles: roles.length ? roles : ['viewer'] };
    });
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
    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    if (!nome || !email) {
      setFormNote('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editingId && form.password.length < 8) {
      setFormNote('Senha mínima: 8 caracteres.');
      return;
    }
    if (editingId && form.password && form.password.length < 8) {
      setFormNote('Nova senha mínima: 8 caracteres (ou deixe em branco).');
      return;
    }
    if (!form.roles?.length) {
      setFormNote('Selecione ao menos uma role.');
      return;
    }

    setSaving(true);
    setFormNote(null);
    try {
      const url = editingId ? `${USERS_URL}/${editingId}` : USERS_URL;
      const body = editingId
        ? {
            nome,
            roles: form.roles,
            active: Boolean(form.active),
            ...(form.password ? { password: form.password } : {}),
          }
        : {
            email,
            nome,
            password: form.password,
            roles: form.roles,
          };
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMessage(json, res));
      closeForm();
      await load();
    } catch (err) {
      setFormNote(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    if (!canWrite || !row?.id) return;
    const next = !row.active;
    const label = next ? 'ativar' : 'desativar';
    if (!window.confirm(`${label} “${row.nome}” (${row.email})?`)) return;
    try {
      const res = await fetch(`${USERS_URL}/${row.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMessage(json, res));
      await load();
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  return (
    <div className="page page-usuarios">
      <header className="page-header">
        <div>
          <h1>Usuários</h1>
          <p className="subtitle">
            Contas do painel (roles acumuláveis: admin · dev · gestor · …)
            {rows.length ? ` · ${rows.length} cadastrado(s)` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={load}
            disabled={loading}
          >
            Atualizar
          </button>
          {canWrite && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              Novo usuário
            </button>
          )}
        </div>
      </header>

      <div className="emp-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar nome, e-mail, role…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="error">Erro: {error}</p>}
      {loading && <p className="muted">Carregando…</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="empty">Nenhum usuário encontrado.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="emp-table-wrap">
          <table className="emp-table usr-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Roles</th>
                <th scope="col">Status</th>
                <th scope="col">Criado</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = me?.id && u.id === me.id;
                return (
                  <tr key={u.id} className={u.active ? '' : 'usr-inactive'}>
                    <td>
                      <div className="emp-person-text">
                        <span className="emp-person-name">{u.nome}</span>
                        {isMe ? (
                          <span className="muted usr-you">você</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="muted">{u.email}</td>
                    <td>
                      <div className="gest-agents">
                        {rolesOf(u).map((r) => (
                          <span
                            key={r}
                            className={`tag usr-role usr-role-${r}`}
                          >
                            {roleLabel(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`tag ${
                          u.active ? 'usr-status-on' : 'usr-status-off'
                        }`}
                      >
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="muted">{formatWhen(u.createdAt)}</td>
                    <td>
                      {canWrite && (
                        <div className="usr-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => openEdit(u)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => toggleActive(u)}
                            disabled={isMe && u.active}
                            title={
                              isMe && u.active
                                ? 'Não desative a própria conta'
                                : undefined
                            }
                          >
                            {u.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            aria-labelledby="usr-form-title"
          >
            <header className="srv-modal-header">
              <h2 id="usr-form-title">
                {editingId ? 'Editar usuário' : 'Novo usuário'}
              </h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Fechar
              </button>
            </header>
            <form className="srv-form usr-form" onSubmit={submitForm}>
              <label>
                Nome
                <input
                  value={form.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                  required
                  maxLength={200}
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                  maxLength={200}
                  disabled={Boolean(editingId)}
                />
              </label>
              <fieldset className="srv-form-span gest-agents-field">
                <legend>Roles (pode combinar)</legend>
                <div className="gest-agents-check">
                  {ROLES.map((r) => (
                    <label key={r.value} className="gest-agent-opt">
                      <input
                        type="checkbox"
                        checked={(form.roles || []).includes(r.value)}
                        onChange={() => toggleRole(r.value)}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                {editingId ? 'Nova senha (opcional)' : 'Senha'}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  minLength={editingId ? undefined : 8}
                  required={!editingId}
                  placeholder={editingId ? 'deixe em branco para manter' : ''}
                />
              </label>
              {editingId && (
                <label className="srv-check srv-form-span">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setField('active', e.target.checked)}
                    disabled={me?.id === editingId}
                  />
                  Conta ativa
                </label>
              )}
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
