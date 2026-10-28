import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrandBar } from './brand.jsx';
import { ConnectionStatusBadge } from './connection-status.jsx';

const CONNECTIONS_URL =
  import.meta.env.VITE_LINKEDIN_CONNECTIONS_URL ??
  '/linkedin-base/connections';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: '0', label: 'Não enviado' },
  { value: '1', label: 'Pendente' },
  { value: '2', label: 'Conectado' },
];

function slugFromUrl(url) {
  const m = String(url || '').match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : url || '—';
}

function displayNameFromUrl(url) {
  const slug = slugFromUrl(url);
  if (!slug || typeof slug !== 'string' || slug === '—') return null;
  const parts = slug.split('-').filter(Boolean);
  while (
    parts.length &&
    (/^\d{5,}$/.test(parts[parts.length - 1]) ||
      (parts[parts.length - 1].length >= 6 &&
        /[0-9]/.test(parts[parts.length - 1]) &&
        /^[a-z0-9]+$/i.test(parts[parts.length - 1])))
  ) {
    parts.pop();
  }
  if (!parts.length) return null;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
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

function ConnAvatar({ name, photoBase64 }) {
  const src = photoSrc(photoBase64);
  if (src) {
    return <img className="msg-avatar" src={src} alt="" loading="lazy" />;
  }
  return (
    <div className="msg-avatar msg-avatar-fallback" aria-hidden>
      {initials(name)}
    </div>
  );
}

function connectionLabel(row) {
  const li = row?.clienteLinkedin;
  const nome = li?.cliente?.nome?.trim();
  if (nome && !/-/.test(nome) && !/linkedin\.com/i.test(nome)) return nome;
  return (
    li?.headline?.split('|')[0]?.trim() ||
    displayNameFromUrl(li?.profileUrl) ||
    slugFromUrl(li?.profileUrl) ||
    nome ||
    row?.clienteLinkedinId ||
    'Conexão'
  );
}

export default function Conexoes({ theme, onToggleTheme, onGoHome, onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') q.set('status', statusFilter);
      const res = await fetch(`${CONNECTIONS_URL}?${q}`);
      if (!res.ok) {
        throw new Error(
          `API vendas (:3000) → ${res.status}. Rode: cd vendas/api && npm run start:dev`,
        );
      }
      const json = await res.json();
      setRows(json?.data ?? []);
    } catch (e) {
      setError(String(e?.message || e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => {
      const label = connectionLabel(c).toLowerCase();
      const url = String(c?.clienteLinkedin?.profileUrl || '').toLowerCase();
      const agent = String(c?.agentId || '').toLowerCase();
      return label.includes(q) || url.includes(q) || agent.includes(q);
    });
  }, [rows, filter]);

  const counts = useMemo(() => {
    const acc = { all: rows.length, 0: 0, 1: 0, 2: 0 };
    for (const c of rows) {
      const s = c?.status;
      if (s === 0 || s === 1 || s === 2) acc[s] += 1;
    }
    return acc;
  }, [rows]);

  function go(path) {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <div className="page page-conexoes">
      <BrandBar eyebrow="Conexões LinkedIn" />
      <header className="header">
        <div>
          <h1>Conexões</h1>
          <p className="subtitle">
            Convites e status na base (`0` fila · `1` pendente · `2` conectado)
          </p>
        </div>
        <div className="header-actions">
          <nav className="nav-links">
            <a
              className="nav-link"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onGoHome?.();
              }}
            >
              Profiles
            </a>
            <a
              className="nav-link nav-link-active"
              href="/conexoes"
              aria-current="page"
            >
              Conexões
            </a>
            <a
              className="nav-link"
              href="/mensagens"
              onClick={(e) => {
                e.preventDefault();
                go('/mensagens');
              }}
            >
              Mensagens
            </a>
          </nav>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => load()}
            disabled={loading}
          >
            Atualizar
          </button>
        </div>
      </header>

      <div className="conn-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Filtrar por nome, URL ou agente…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="conn-status-filters" role="group" aria-label="Status">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            const n =
              f.value === 'all'
                ? null
                : statusFilter === 'all'
                  ? counts[Number(f.value)]
                  : null;
            return (
              <button
                key={f.value}
                type="button"
                className={`conn-filter-chip${active ? ' active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
                aria-pressed={active}
              >
                {f.label}
                {n != null ? ` (${n})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="error">Erro: {error}</p>}
      {loading && <p className="muted">Carregando conexões…</p>}
      {!loading && !filtered.length && (
        <p className="empty">Nenhuma conexão neste filtro.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="conn-table-wrap">
          <table className="conn-table">
            <thead>
              <tr>
                <th scope="col">Pessoa</th>
                <th scope="col">Status</th>
                <th scope="col">Agente</th>
                <th scope="col">Convite</th>
                <th scope="col">Aceite</th>
                <th scope="col">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const label = connectionLabel(c);
                const url = c?.clienteLinkedin?.profileUrl;
                const status = c?.status;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="conn-person">
                        <ConnAvatar
                          name={label}
                          photoBase64={c.clienteLinkedin?.photoBase64}
                        />
                        <div className="conn-person-text">
                          <span className="conn-person-name">{label}</span>
                          {c.clienteLinkedin?.headline && (
                            <span className="muted conn-person-headline">
                              {c.clienteLinkedin.headline}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <ConnectionStatusBadge status={status} />
                    </td>
                    <td>
                      <code className="conn-agent">{c.agentId || '—'}</code>
                    </td>
                    <td className="muted">{formatWhen(c.invitedAt)}</td>
                    <td className="muted">{formatWhen(c.connectedAt)}</td>
                    <td>
                      {url ? (
                        <a
                          className="linkedin-link"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {slugFromUrl(url)}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
