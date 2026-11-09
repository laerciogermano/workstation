import { Suspense, useEffect, useSyncExternalStore } from 'react';
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router';
import { Icon, type IconName } from '../ui/Icon';
import { Wordmark } from '../ui/Wordmark';
import { useMe } from '../lib/queries';
import { api } from '../lib/api';
import { dequeue, pending } from '../lib/offline-queue';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../ui/Toast';
import { Skel } from '../ui/bits';

/**
 * Menu transversal (sidenav ≥1024px + tabbar mobile) — exatamente 7 itens.
 * Antes a tabbar usava só 4 + FAB "Nota", então Gasto/Perfil/Adicionar nota não apareciam no mobile.
 */
const MENU: { to: string; icon: IconName; label: string; match: RegExp }[] = [
  { to: '/', icon: 'grid', label: 'Produtos', match: /^\/($|produto|busca|mapa)/ },
  { to: '/lojas', icon: 'store', label: 'Lojas', match: /^\/lojas/ },
  { to: '/listas', icon: 'list', label: 'Listas', match: /^\/listas/ },
  { to: '/nota', icon: 'qr', label: 'Adicionar nota', match: /^\/nota(\/|$)/ },
  { to: '/notas', icon: 'receipt', label: 'Notas', match: /^\/notas/ },
  { to: '/gastos', icon: 'chart', label: 'Gasto do mês', match: /^\/gastos/ },
  { to: '/perfil', icon: 'user', label: 'Perfil', match: /^\/(perfil|conta)/ },
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
  const [searchParams] = useSearchParams();
  const isDark = pathname === '/nota' || pathname.startsWith('/nota/ler');
  /** Tabbar some só com busca ativa (q ou categoria); /busca vazio ou fora dela → menu de volta. */
  const searchActive =
    pathname === '/busca' && !!(searchParams.get('q')?.trim() || searchParams.get('categoria'));
  const hideTabbar = isDark || searchActive;

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
        {MENU.map((t) => (
          <NavLink key={t.to} to={t.to} viewTransition className={() => `dnav ${t.match.test(pathname) ? 'on' : ''}`}>
            <Icon name={t.icon} />
            {t.label}
          </NavLink>
        ))}
        {me.data?.user?.role === 'admin' && (
          <NavLink to="/admin" className="dnav">
            <Icon name="shield" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="shell-body">
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

      {!hideTabbar && (
        <nav className="tabbar" aria-label="Principal">
          {MENU.map((t) => {
            const on = t.match.test(pathname);
            const addNota = t.to === '/nota';
            return (
              <NavLink
                key={t.to}
                to={t.to}
                viewTransition
                className={`tab ${addNota ? 'fab' : ''} ${on ? 'on' : ''}`}
                aria-label={addNota ? 'Adicionar nota' : undefined}
              >
                {addNota ? (
                  <span className="fabbtn">
                    <Icon name={t.icon} />
                  </span>
                ) : (
                  <Icon name={t.icon} />
                )}
                <span>{t.label}</span>
              </NavLink>
            );
          })}
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
