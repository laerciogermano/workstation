import { useCallback, useEffect, useState } from 'react';
const EMPRESAS_URL = import.meta.env.VITE_EMPRESAS_URL ?? '/empresas';
const PAGE_SIZE = 100;

function formatMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initials(name) {
  return (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Empresas({
  theme,
  onToggleTheme,
  onGoHome,
  onNavigate,
}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pages: 1,
    comCnpj: 0,
    semCnpj: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filtroCnpj, setFiltroCnpj] = useState('all'); // all | yes | no

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
        if (filtroCnpj === 'yes') params.set('comCnpj', 'true');
        if (filtroCnpj === 'no') params.set('comCnpj', 'false');
        const res = await fetch(`${EMPRESAS_URL}?${params}`);
        if (!res.ok) throw new Error(`empresas HTTP ${res.status}`);
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        setMeta({
          total: json.meta?.total ?? data.length,
          page: json.meta?.page ?? pageNum,
          pages: json.meta?.pages ?? 1,
          comCnpj: json.meta?.comCnpj ?? 0,
          semCnpj: json.meta?.semCnpj ?? 0,
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
    [debouncedQ, filtroCnpj],
  );

  useEffect(() => {
    load(page, page > 1);
  }, [load, page]);

  function go(path) {
    if (onNavigate) onNavigate(path);
    else {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  const hasMore = meta.page < meta.pages;

  return (
    <div className="page page-empresas">
      <header className="page-header">
        <div>
          <h1>Empresas</h1>
          <p className="subtitle">
            CNPJs e razões sociais do funil Conect (portal CR + planilhas)
            {meta.total
              ? ` · ${meta.total} cadastros (${meta.comCnpj} com CNPJ)`
              : ''}
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

      <div className="emp-toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar razão social, fantasia ou CNPJ…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="emp-filters" role="group" aria-label="CNPJ">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'yes', label: 'Com CNPJ' },
            { value: 'no', label: 'Sem CNPJ' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              className={`emp-filter-chip${filtroCnpj === f.value ? ' active' : ''}`}
              onClick={() => {
                setFiltroCnpj(f.value);
                setPage(1);
              }}
              aria-pressed={filtroCnpj === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">Erro: {error}</p>}
      {loading && page === 1 && <p className="muted">Carregando empresas…</p>}
      {!loading && !rows.length && (
        <p className="empty">Nenhuma empresa neste filtro.</p>
      )}

      {rows.length > 0 && (
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th scope="col">Empresa</th>
                <th scope="col">CNPJ</th>
                <th scope="col">Pedidos</th>
                <th scope="col">Valor pedidos</th>
                <th scope="col">Orçamentos</th>
                <th scope="col">Vendedores</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="emp-person">
                      <div className="emp-avatar" aria-hidden>
                        {initials(e.razaoSocial)}
                      </div>
                      <div className="emp-person-text">
                        <span className="emp-person-name">{e.razaoSocial}</span>
                        {e.nomeFantasia && (
                          <span className="muted emp-person-fantasia">
                            {e.nomeFantasia}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {e.cnpj ? (
                      <code className="emp-cnpj">{e.cnpj}</code>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="emp-num">{e.pedidosQtd ?? 0}</td>
                  <td className="emp-num">{formatMoney(e.pedidosValor)}</td>
                  <td className="emp-num">{e.orcamentosQtd ?? 0}</td>
                  <td className="muted">
                    {(e.vendedores || []).slice(0, 4).join(', ') || '—'}
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
    </div>
  );
}
