import { NavLink, Outlet, useLocation } from 'react-router-dom';

const nav: { group: string; links: { to: string; label: string; end?: boolean }[] }[] = [
  {
    group: 'Trabalho',
    links: [
      { to: '/', label: 'Board', end: true },
      { to: '/board/config', label: 'Colunas e raias' },
    ],
  },
  {
    group: 'Tempo e fluxo',
    links: [
      { to: '/gantt', label: 'Plano / Gantt' },
      { to: '/gantt/fop', label: 'Editor FOP' },
      { to: '/gantt/maquina', label: 'Editor máquina' },
      { to: '/gantt/exportar', label: 'Exportar código' },
    ],
  },
  {
    group: 'Estrutura',
    links: [
      { to: '/arvore', label: 'Árvore de execução' },
      { to: '/explorar', label: 'Explorar' },
    ],
  },
  {
    group: 'Configurações',
    links: [{ to: '/configuracoes/catalogo', label: 'Catálogo de responsáveis' }],
  },
];

function titleFromPath(path: string) {
  const map: Record<string, string> = {
    '/': 'Board',
    '/board/config': 'Colunas e raias',
    '/gantt': 'Plano / Gantt',
    '/gantt/fop': 'Editor FOP',
    '/gantt/maquina': 'Editor máquina',
    '/gantt/exportar': 'Exportar código',
    '/arvore': 'Árvore de execução',
    '/explorar': 'Explorar',
    '/configuracoes/catalogo': 'Catálogo',
  };
  if (path.startsWith('/explorar/')) return 'Detalhe do arquivo';
  return map[path] ?? 'Plans';
}

export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Plans
          <span>Intenção → roteiro acompanhável</span>
        </div>
        <nav className="sidebar-nav">
          {nav.map((g) => (
            <div key={g.group}>
              <div className="nav-group-title">{g.group}</div>
              {g.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Plans · <strong>{titleFromPath(pathname)}</strong>
          </div>
          <div className="topbar-actions">
            <span className="muted">Organizador</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
