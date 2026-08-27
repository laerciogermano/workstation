import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { responsibleById, units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

export function ExploreListPage() {
  const [q, setQ] = useState('');
  const [path, setPath] = useState<string[]>([]);

  const currentParent = path[path.length - 1];
  const list = useMemo(() => {
    let items = units.filter((u) => (currentParent ? u.parentId === currentParent : !u.parentId));
    if (q.trim()) {
      const t = q.toLowerCase();
      items = units.filter((u) => u.title.toLowerCase().includes(t));
    }
    return items.slice().sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }, [q, currentParent]);

  const crumb = [
    { id: '', title: 'Raiz' },
    ...path.map((id) => ({ id, title: units.find((u) => u.id === id)?.title ?? id })),
  ];

  return (
    <div>
      <PageHeader title="Explorar" subtitle="Arquivos ordenados por título, busca e drill-down com breadcrumb." />

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="panel-body">
          <input
            placeholder="Buscar por título"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '100%' }}
          />
          <div className="breadcrumb-trail">
            {crumb.map((c, i) => (
              <span key={`${c.id}-${i}`}>
                {i > 0 ? ' / ' : null}
                <button
                  type="button"
                  className="linkish"
                  onClick={() => {
                    setQ('');
                    setPath(path.slice(0, i));
                  }}
                >
                  {c.title}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          {list.length === 0 ? (
            <p className="muted">Nenhum arquivo correspondente — lista vazia utilizável.</p>
          ) : (
            <ul className="file-list">
              {list.map((f) => {
                const resp = responsibleById(f.responsibleId);
                const hasChildren = units.some((u) => u.parentId === f.id);
                return (
                  <li key={f.id}>
                    <div>
                      <Link to={`/explorar/${f.id}`}>{f.title}</Link>
                      <div className="row gap wrap">
                        {f.archived ? <Badge tone="warn">arquivado</Badge> : null}
                        {resp ? <Badge tone="info">{resp.type}</Badge> : null}
                      </div>
                    </div>
                    <div className="row gap">
                      {hasChildren && !q ? (
                        <button type="button" className="btn ghost" onClick={() => setPath([...path, f.id])}>
                          Abrir pasta
                        </button>
                      ) : null}
                      <Link className="btn ghost" to={`/explorar/${f.id}`}>
                        Detalhe
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
