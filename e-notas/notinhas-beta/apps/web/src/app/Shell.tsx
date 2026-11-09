import { Suspense, useEffect, useSyncExternalStore } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Icon, type IconName } from '../ui/Icon';
import { Wordmark } from '../ui/Wordmark';
import { ThemePicker } from '../ui/ThemePicker';
import { useMe } from '../lib/queries';
import { api } from '../lib/api';
import { dequeue, pending } from '../lib/offline-queue';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../ui/Toast';
import { Skel } from '../ui/bits';

const TABS: { to: string; icon: IconName; label: string; match: RegExp }[] = [
  { to: '/', icon: 'grid', label: 'Produtos', match: /^\/($|produto|busca|mapa)/ },
  { to: '/lojas', icon: 'store', label: 'Lojas', match: /^\/lojas/ },
  { to: '/listas', icon: 'list', label: 'Listas', match: /^\/listas/ },
  { to: '/notas', icon: 'receipt', label: 'Notas', match: /^\/(notas|gastos)/ },
];

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};
const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

export function Shell() {
  const { pathname } = useLocation();
  const online = useOnline();
  const me = useMe();
  const isDark = pathname === '/nota' || pathname.startsWith('/nota/ler');

  useEffect(() => {
    document.documentElement.classList.remove('back');
  }, [pathname]);

  // T-71: notas lidas sem rede sobem quando a conexão volta
  const qc = useQueryClient();
  const toast = useToast();
  useEffect(() => {
    if (!online) return;
    const urls = pending();
    if (!urls.length) return;
    void (async () => {
      let sent = 0;
      for (const url of urls) {
        try {
          await api('/notas', { method: 'POST', body: { url } });
          sent++;
        } catch {
          /* link inválido ou SEFAZ fora: o servidor guarda na fila dele */
        }
        dequeue(url);
      }
      if (sent) {
        toast({ text: `${sent} nota${sent > 1 ? 's' : ''} enviada${sent > 1 ? 's' : ''} agora que a rede voltou` });
        await qc.invalidateQueries();
      }
    })();
  }, [online, qc, toast]);

  return (
    <div className="shell">
      <nav className="sidenav" aria-label="Principal">
        <NavLink to="/" viewTransition>
          <Wordmark />
        </NavLink>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} viewTransition className={() => `dnav ${t.match.test(pathname) ? 'on' : ''}`}>
            <Icon name={t.icon} />
            {t.label}
          </NavLink>
        ))}
        <NavLink to="/perfil" viewTransition className={({ isActive }) => `dnav ${isActive ? 'on' : ''}`}>
          <Icon name="user" />
          {me.data?.user ? 'Perfil' : 'Perfil e conta'}
        </NavLink>
        {me.data?.user?.role === 'admin' && (
          <NavLink to="/admin" className="dnav">
            <Icon name="shield" />
            Admin
          </NavLink>
        )}
        <NavLink to="/nota" viewTransition className="btn p">
          <Icon name="qr" />
          Escanear nota
        </NavLink>
        <span className="sp" />
        <ThemePicker placement="up" withLabel />
        {me.data && (
          <NavLink to="/pontos" className="ptschip" style={{ alignSelf: 'flex-start' }}>
            <Icon name="award" />
            <span className="tnum">{me.data.points} pontos</span>
          </NavLink>
        )}
      </nav>

      <div>
        {!online && (
          <div className="banner warn offline" role="status">
            <Icon name="wifioff" />
            <span>Sem conexão. Mostrando os últimos preços salvos — confira a data de cada um.</span>
          </div>
        )}
        <main className={`main ${isDark ? 'dark' : ''}`}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {!isDark && (
        <nav className="tabbar" aria-label="Principal">
          {TABS.slice(0, 2).map((t) => (
            <NavLink key={t.to} to={t.to} viewTransition className={`tab ${t.match.test(pathname) ? 'on' : ''}`}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </NavLink>
          ))}
          <NavLink to="/nota" viewTransition className="tab fab" aria-label="Depositar nota">
            <span className="fabbtn">
              <Icon name="qr" />
            </span>
            <span>Nota</span>
          </NavLink>
          {TABS.slice(2).map((t) => (
            <NavLink key={t.to} to={t.to} viewTransition className={`tab ${t.match.test(pathname) ? 'on' : ''}`}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

/** T-73: skeleton com a forma real da tela, nunca spinner. */
export function PageSkeleton({ bare = false }: { bare?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Carregando">
      {!bare && <Skel h={50} r={999} />}
      <div className="flex mt8">
        <Skel h={36} w={110} r={999} />
        <Skel h={36} w={130} r={999} />
        <Skel h={36} w={90} r={999} />
      </div>
      <div className="pgrid mt16">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="pc" key={i}>
            <Skel h={140} r={10} />
            <Skel h={12} w="80%" />
            <Skel h={18} w="50%" />
            <Skel h={10} w="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}
