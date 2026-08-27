import { NavLink, Outlet, useLocation } from 'react-router-dom';

const primaryNav = [
  { to: '/', label: 'Board', end: true },
  { to: '/gantt', label: 'Plano / Gantt' },
  { to: '/arvore', label: 'Árvore de execução' },
];

const transversalNav = [
  { to: '/explorar', label: 'Explorar' },
  { to: '/configuracoes/catalogo', label: 'Configurações' },
];

function titleFromPath(path: string) {
  const map: Record<string, string> = {
    '/': 'Board',
    '/gantt': 'Plano / Gantt',
    '/arvore': 'Árvore de execução',
    '/explorar': 'Explorar',
    '/configuracoes/catalogo': 'Configurações',
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
          <div className="nav-group-title">Visões</div>
          {primaryNav.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <nav className="sidebar-nav sidebar-nav-bottom">
          <div className="nav-group-title">Transversais</div>
          {transversalNav.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {l.label}
            </NavLink>
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
