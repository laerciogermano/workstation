import {
  ChartBar,
  ChatCircle,
  DownloadSimple,
  Funnel,
  Robot,
  SignOut,
  UserGear,
  UsersThree,
} from '@phosphor-icons/react';
import { clearSession, getUser, hasPermission } from './auth.js';
import { BrandLogo, ThemeToggle } from './brand.jsx';

const ICON_PROPS = { size: 18, weight: 'thin', 'aria-hidden': true };

export function ExtractIcon({ className }) {
  return <DownloadSimple className={className} {...ICON_PROPS} />;
}

const LINKS = [
  {
    id: 'funil',
    href: '/funil',
    label: 'Funil',
    Icon: Funnel,
    permission: 'profiles:read',
  },
  {
    id: 'mensagens',
    href: '/mensagens',
    label: 'Mensagens',
    Icon: ChatCircle,
    permission: 'messages:read',
  },
  {
    id: 'agentes',
    href: '/agentes',
    label: 'Agentes',
    Icon: Robot,
    permission: 'agentes:read',
  },
  {
    id: 'gestores',
    href: '/gestores',
    label: 'Gestores',
    Icon: UsersThree,
    permission: 'gestores:read',
  },
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboards',
    Icon: ChartBar,
    permission: 'dashboard:read',
  },
  {
    id: 'usuarios',
    href: '/usuarios',
    label: 'Usuários',
    Icon: UserGear,
    permission: 'users:read',
  },
];

function NavLink({ item, active, onNavigate }) {
  const isActive = active === item.id;
  const { Icon } = item;
  return (
    <a
      className={`nav-link${isActive ? ' nav-link-active' : ''}`}
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        onNavigate?.(item.href);
      }}
    >
      <Icon className="nav-link-icon" {...ICON_PROPS} />
      {item.label}
    </a>
  );
}

/** Menu transversal vertical (esquerda): logo + links; Hero Dia/Noite no rodapé */
export function AppNav({ active, onNavigate, onHome, theme, onToggleTheme }) {
  const user = getUser();
  const visible = LINKS.filter((l) => hasPermission(l.permission));

  function logout() {
    clearSession();
    window.location.href = '/login';
  }

  return (
    <nav className="app-nav" aria-label="Principal">
      <BrandLogo className="logo app-nav-logo" onHome={onHome} />
      {visible.map((item) => (
        <NavLink
          key={item.id}
          item={item}
          active={active}
          onNavigate={onNavigate}
        />
      ))}
      <div className="app-nav-footer">
        {user?.email && (
          <p className="app-nav-user muted" title={user.email}>
            {user.nome || user.email}
            <span className="app-nav-role">
            {(user.roles || [user.role]).filter(Boolean).join(' · ')}
          </span>
          </p>
        )}
        <button
          type="button"
          className="nav-link app-nav-logout"
          onClick={logout}
        >
          <SignOut className="nav-link-icon" {...ICON_PROPS} />
          Sair
        </button>
        <ThemeToggle
          theme={theme}
          onToggle={onToggleTheme}
          className="app-nav-theme"
        />
      </div>
    </nav>
  );
}
