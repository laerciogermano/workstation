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
