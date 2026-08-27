import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ExploreTreePanel } from '../explore/ExploreTreePanel';

const primaryNav = [
  { to: '/', label: 'Board', end: true },
  { to: '/gantt', label: 'Plano / Gantt' },
  { to: '/arvore', label: 'Árvore de execução' },
];

function titleFromPath(path: string) {
  const map: Record<string, string> = {
    '/': 'Board',
    '/gantt': 'Plano / Gantt',
    '/arvore': 'Árvore de execução',
    '/configuracoes/catalogo': 'Configurações',
  };
  return map[path] ?? 'Plans';
}

export function AppLayout() {
  const { pathname } = useLocation();
  const showViews = !pathname.startsWith('/configuracoes');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Plans
          <span>Intenção → roteiro acompanhável</span>
        </div>
        <div className="sidebar-explore">
          <div className="nav-group-title">Explorar</div>
          <ExploreTreePanel />
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Plans · <strong>{titleFromPath(pathname)}</strong>
          </div>
          {showViews ? (
            <nav className="views-nav" aria-label="Visões">
              {primaryNav.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => (isActive ? 'views-link active' : 'views-link')}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <div className="views-nav-spacer" />
          )}
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
