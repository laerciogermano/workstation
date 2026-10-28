import { useCallback, useEffect, useState } from 'react';

const AVDS_URL = import.meta.env.VITE_AVDS_URL ?? '/avds';
const SERVIDORES_URL = import.meta.env.VITE_SERVIDORES_URL ?? '/servidores';

const EMPTY_FORM = {
  nome: '',
  servidorId: '',
  fromBackup: '',
  adbPort: '',
  start: true,
  notas: '',
};

function statusLabel(s) {
  if (s === 'ativo') return 'Ativo';
  if (s === 'dormindo') return 'Dormindo';
  if (s === 'criando') return 'Criando';
  if (s === 'erro') return 'Erro';
  return s || '—';
}

function formatBytes(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  const v = Number(n);
  if (v < 1024) return `${v} B`;
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  return `${(v / 1024 ** 3).toFixed(2)} GB`;
}

function errMsg(json, res) {
  const m = json?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return `${res.status} ${res.statusText}`;
}

export default function Avds() {
  const [ativos, setAtivos] = useState([]);
  const [dormindo, setDormindo] = useState([]);
  const [outros, setOutros] = useState([]);
  const [meta, setMeta] = useState({ total: 0, ativos: 0, dormindo: 0 });
  const [servidores, setServidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  /** @type {[Record<string, {ok:boolean,adb:string,docker:string,bootCompleted:boolean|null,ms:number,detail?:string|null}>, Function]} */
  const [pingById, setPingById] = useState({});
  const [note, setNote] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formNote, setFormNote] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadServidores = useCallback(async () => {
    try {
      const res = await fetch(`${SERVIDORES_URL}?limit=200&status=active`);
      if (!res.ok) return;
      const json = await res.json();
      setServidores(Array.isArray(json.data) ? json.data : []);
    } catch {
      /* ignore */
    }
  }, []);

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
        const res = await fetch(`${AVDS_URL}?${params}`);
        if (!res.ok) throw new Error(`avds HTTP ${res.status}`);
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
    loadServidores();
  }, [loadServidores]);

  useEffect(() => {
    load({ sync: false });
  }, [load]);

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      servidorId: servidores[0]?.id ?? '',
    });
    setFormNote(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setFormNote(null);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (saving) return;
    const nome = form.nome.trim();
    if (!nome || !form.servidorId) {
      setFormNote('Nome e servidor são obrigatórios.');
      return;
    }
    const payload = {
      nome,
      servidorId: form.servidorId,
      start: Boolean(form.start),
      notas: form.notas.trim() || null,
    };
    if (form.fromBackup.trim()) payload.fromBackup = form.fromBackup.trim();
    const port = Number(form.adbPort);
    if (Number.isFinite(port) && port >= 1 && port <= 65535) {
      payload.adbPort = port;
    }
    setSaving(true);
    setFormNote(null);
    try {
      const res = await fetch(AVDS_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));
      closeForm();
      setNote(`AVD “${nome}” criado.`);
      await load({ sync: true });
    } catch (err) {
      setFormNote(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(row, action) {
    if (!row?.id) return;
    // Só bloqueia a mesma linha (antes: qualquer busyId engolia o clique sem feedback)
    if (busyId === row.id) return;

    if (action === 'remove') {
      const ok = window.confirm(
        `Remover AVD “${row.nome}” (${row.containerName})? O container será apagado no host.`,
      );
      if (!ok) return;
    }
    if (action === 'backup') {
      const ok = window.confirm(
        `Exportar backup de “${row.nome}”? O container será parado durante o tar e subirá de novo se estava ativo.`,
      );
      if (!ok) return;
    }

    setBusyId(row.id);
    setNote(null);
    setError(null);
    try {
      if (action === 'remove') {
        const res = await fetch(`${AVDS_URL}/${row.id}`, { method: 'DELETE' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(errMsg(json, res));
        setNote(`Removido ${row.nome}.`);
        setBusyId(null);
        await load({ sync: false });
        return;
      }

      if (action === 'download') {
        const res = await fetch(`${AVDS_URL}/${row.id}/backup`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(errMsg(json, res));
        }
        const blob = await res.blob();
        const cd = res.headers.get('content-disposition') || '';
        const m = cd.match(/filename="?([^"]+)"?/i);
        const filename = m?.[1] || `${row.nome}-android-home.tar.gz`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setNote(`Download iniciado: ${filename}`);
        return;
      }

      if (action === 'ping') {
        setPingById((prev) => ({
          ...prev,
          [row.id]: {
            ok: false,
            adb: '…',
            docker: 'n/a',
            bootCompleted: null,
            ms: 0,
            serial: row.serial,
          },
        }));
        const res = await fetch(`${AVDS_URL}/${row.id}/ping`, {
          method: 'POST',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(errMsg(json, res));
        setPingById((prev) => ({ ...prev, [row.id]: json }));
        const boot =
          json.bootCompleted === true
            ? 'boot=1'
            : json.bootCompleted === false
              ? 'boot=0'
              : 'boot=?';
        const msg = `Ping ${row.nome}: adb=${json.adb} ${boot} · ${json.serial || row.serial} (${json.ms}ms)${
          json.ok ? ' · ok' : ''
        }${json.detail ? ` — ${json.detail}` : ''}`;
        setNote(msg);
        if (!json.ok) setError(msg);
        return;
      }

      const path =
        action === 'sleep'
          ? 'sleep'
          : action === 'wake'
            ? 'wake'
            : action === 'backup'
              ? 'backup'
              : null;
      if (!path) return;

      const res = await fetch(`${AVDS_URL}/${row.id}/${path}`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errMsg(json, res));

      if (action === 'backup') {
        setNote(
          `Backup ok: ${json.path || '—'} (${formatBytes(json.sizeBytes)})`,
        );
      } else if (action === 'sleep') {
        setNote(`${row.nome} dormindo.`);
      } else {
        setNote(`${row.nome} ativo.`);
      }
      setBusyId(null);
      await load({ sync: false });
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setBusyId(null);
    }
  }

  function renderTable(rows, emptyLabel) {
    if (!rows.length) {
      return <p className="muted avd-empty">{emptyLabel}</p>;
    }
    return (
      <div className="emp-table-wrap">
        <table className="emp-table srv-table avd-table">
          <thead>
            <tr>
              <th scope="col">AVD</th>
              <th scope="col">Servidor</th>
              <th scope="col">Serial / porta</th>
              <th scope="col">Status</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const busy = busyId === a.id;
              return (
                <tr key={a.id}>
                  <td>
                    <div className="emp-person-text">
                      <span className="emp-person-name">{a.nome}</span>
                      <span className="muted">
                        <code>{a.containerName}</code>
                      </span>
                    </div>
                  </td>
                  <td>
                    {a.servidor?.nome || '—'}
                    {a.servidor?.ipPrivado || a.servidor?.ipPublico ? (
                      <div className="muted srv-ip-priv">
                        {a.servidor.ipPrivado || a.servidor.ipPublico}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <code>{a.serial}</code>
                    <div className="muted srv-ip-priv">ADB {a.adbPort}</div>
                  </td>
                  <td>
                    <span className={`srv-status avd-status-${a.status}`}>
                      {statusLabel(a.status)}
                    </span>
                    {pingById[a.id] ? (
                      <div
                        className={
                          pingById[a.id].ok
                            ? 'muted avd-ping avd-ping-ok'
                            : 'error avd-ping'
                        }
                        title={pingById[a.id].detail || undefined}
                      >
                        ADB {pingById[a.id].adb}
                        {pingById[a.id].bootCompleted === true
                          ? ' · boot'
                          : ''}
                        {pingById[a.id].serial
                          ? ` · ${pingById[a.id].serial}`
                          : ''}
                        {pingById[a.id].docker &&
                        pingById[a.id].docker !== 'n/a' &&
                        pingById[a.id].docker !== 'missing'
                          ? ` · docker ${pingById[a.id].docker}`
                          : ''}
                      </div>
                    ) : null}
                    {a.lastError ? (
                      <div className="error avd-err" title={a.lastError}>
                        {a.lastError.slice(0, 80)}
                        {a.lastError.length > 80 ? '…' : ''}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="srv-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => runAction(a, 'ping')}
                      >
                        Ping
                      </button>
                      {a.status === 'ativo' ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy}
                          onClick={() => runAction(a, 'sleep')}
                        >
                          Dormir
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || a.status === 'criando'}
                          onClick={() => runAction(a, 'wake')}
                        >
                          Acordar
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => runAction(a, 'backup')}
                      >
                        Backup
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => runAction(a, 'download')}
                      >
                        Baixar tar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => runAction(a, 'remove')}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="page page-avds">
      <header className="page-header">
        <div>
          <h1>AVDs</h1>
          <p className="subtitle">
            Emuladores docker-avd nos servidores
            {meta.total
              ? ` · ${meta.ativos} ativo(s) · ${meta.dormindo} dormindo`
              : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => load({ sync: true })}
            disabled={loading || syncing}
          >
            {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => load({ sync: false })}
            disabled={loading || syncing}
          >
            Atualizar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
            disabled={!servidores.length}
          >
            Novo AVD
          </button>
        </div>
      </header>

      <div className="emp-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar nome, container, serial…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="error avd-note">Erro: {error}</p>}
      {note && !error && <p className="avd-note avd-note-ok">{note}</p>}
      {loading && <p className="muted">Carregando AVDs…</p>}
      {!loading && !meta.total && (
        <p className="empty">
          Nenhum AVD. Use <strong>Sincronizar</strong> para descobrir containers
          no host ou <strong>Novo AVD</strong> para criar.
        </p>
      )}

      {!loading && meta.total > 0 && (
        <>
          <section className="avd-section">
            <h2 className="avd-section-title">
              Ativos <span className="muted">({meta.ativos})</span>
            </h2>
            {renderTable(ativos, 'Nenhum AVD ativo.')}
          </section>
          <section className="avd-section">
            <h2 className="avd-section-title">
              Dormindo <span className="muted">({meta.dormindo})</span>
            </h2>
            {renderTable(dormindo, 'Nenhum AVD dormindo.')}
          </section>
          {outros.length > 0 && (
            <section className="avd-section">
              <h2 className="avd-section-title">
                Outros <span className="muted">({outros.length})</span>
              </h2>
              {renderTable(outros, '')}
            </section>
          )}
        </>
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
            aria-labelledby="avd-modal-title"
          >
            <header className="srv-modal-header">
              <h2 id="avd-modal-title">Novo AVD</h2>
              <button type="button" className="btn-secondary" onClick={closeForm}>
                Fechar
              </button>
            </header>
            <form className="srv-form" onSubmit={submitCreate}>
              <label>
                Nome *
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                  placeholder="agent-f"
                />
              </label>
              <label>
                Servidor *
                <select
                  required
                  value={form.servidorId}
                  onChange={(e) => setField('servidorId', e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {servidores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                      {s.localhost
                        ? ' (localhost)'
                        : s.ipPrivado || s.ipPublico
                        ? ` (${s.ipPrivado || s.ipPublico})`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="srv-form-span">
                Backup tar (opcional)
                <input
                  value={form.fromBackup}
                  onChange={(e) => setField('fromBackup', e.target.value)}
                  placeholder="/root/avd-artifacts/agent-d-android-home-….tar.gz"
                />
              </label>
              <label>
                Porta ADB
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={form.adbPort}
                  onChange={(e) => setField('adbPort', e.target.value)}
                  placeholder="auto (hash do nome)"
                />
              </label>
              <label className="srv-check">
                <input
                  type="checkbox"
                  checked={form.start}
                  onChange={(e) => setField('start', e.target.checked)}
                />
                Subir após criar (ativo)
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
                  {saving ? 'Criando…' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
