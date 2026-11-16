import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { api, ApiError } from '../lib/api.ts';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, staleTime: 60_000 });

  if (me.error instanceof ApiError && me.error.status === 401) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (me.isPending) return <div className="boot" aria-busy="true" />;

  async function logout() {
    await api.logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/campanhas" className="brand" aria-label="Connect — e-mail marketing">
            <img src="/logo.svg" alt="" height={26} />
            <span className="brand-product">E-mail marketing</span>
          </NavLink>
          <nav className="mainnav" aria-label="Principal">
            <NavLink to="/campanhas">Campanhas</NavLink>
            <NavLink to="/listas">Listas</NavLink>
          </nav>
          <div className="topbar-user">
            <span className="muted">{me.data?.email}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={logout} aria-label="Sair" title="Sair">
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
