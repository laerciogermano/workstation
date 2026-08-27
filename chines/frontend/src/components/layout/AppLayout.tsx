import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NotificationsPanel } from '../ui/NotificationsPanel';

type NavLink = { to: string; label: string; end?: boolean };

const nav: { group: string; links: NavLink[] }[] = [
  { group: 'Principal', links: [{ to: '/', label: 'Dashboard', end: true }] },
  {
    group: 'Produtos',
    links: [
      { to: '/produtos', label: 'Lista de produtos' },
      { to: '/produtos/importacao', label: 'Importação' },
    ],
  },
  {
    group: 'Monitoramento',
    links: [
      { to: '/monitoramento/anuncios', label: 'Anúncios coletados' },
      { to: '/monitoramento/mapeamento', label: 'Mapeamento de preços' },
      { to: '/monitoramento/historico', label: 'Histórico' },
      { to: '/monitoramento/log', label: 'Log de varreduras' },
    ],
  },
  {
    group: 'Fiscalização',
    links: [
      { to: '/fiscalizacao/ocorrencias', label: 'Ocorrências' },
      { to: '/fiscalizacao/nao-cadastrados', label: 'Não cadastrados' },
    ],
  },
  {
    group: 'Parceiros',
    links: [{ to: '/parceiros', label: 'Lista de parceiros' }],
  },
  {
    group: 'Relatórios',
    links: [{ to: '/relatorios/ranking', label: 'Ranking de conformidade' }],
  },
  {
    group: 'Configurações',
    links: [
      { to: '/configuracoes/canais', label: 'Canais' },
      { to: '/configuracoes/pma', label: 'Regras de PMA' },
      { to: '/configuracoes/alertas', label: 'Relatórios e alertas' },
    ],
  },
];

function titleFromPath(path: string) {
  const map: Record<string, string> = {
    '/': 'Dashboard',
    '/produtos': 'Produtos',
    '/produtos/novo': 'Novo produto',
    '/produtos/importacao': 'Importação',
    '/monitoramento/anuncios': 'Anúncios',
    '/monitoramento/mapeamento': 'Mapeamento',
    '/monitoramento/historico': 'Histórico',
    '/monitoramento/log': 'Log',
    '/fiscalizacao/ocorrencias': 'Ocorrências',
    '/fiscalizacao/nao-cadastrados': 'Não cadastrados',
    '/parceiros': 'Parceiros',
    '/relatorios/ranking': 'Ranking',
    '/configuracoes/canais': 'Canais',
    '/configuracoes/pma': 'Regras PMA',
    '/configuracoes/alertas': 'Alertas',
  };
  if (path.includes('/produtos/') && path !== '/produtos/novo' && path !== '/produtos/importacao') return 'Editar produto';
  if (path.includes('/monitoramento/anuncios/')) return 'Detalhe do anúncio';
  if (path.includes('/fiscalizacao/ocorrencias/')) return 'Detalhe da ocorrência';
  if (path.includes('/parceiros/')) return 'Parceiro';
  return map[path] ?? 'Bluetti MAP';
}

export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Bluetti MAP
          <span>Monitoramento de preços</span>
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
            Bluetti MAP · <strong>{titleFromPath(pathname)}</strong>
          </div>
          <div className="topbar-actions">
            <NotificationsPanel />
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Analista comercial</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
