import type { JSX, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useMe } from '../lib/queries';
import { Loading } from '../ui/primitives';

/** Exige sessão; consentimento e onboarding pendentes levam ao passo certo. */
export function RequireAuth({ children, allowOnboarding }: { children: ReactNode; allowOnboarding?: boolean }): JSX.Element {
  const { data: me, isLoading } = useMe();
  const loc = useLocation();
  if (isLoading) return <Loading />;
  if (!me) return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (me.needsConsent && loc.pathname !== '/consentimento') return <Navigate to="/consentimento" replace />;
  if (!me.onboarded && !allowOnboarding) return <Navigate to="/onboarding/tipos" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }): JSX.Element {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <Loading />;
  if (!me) return <Navigate to="/entrar?next=/admin" replace />;
  if (me.role !== 'admin') return <Navigate to="/explorar" replace />;
  return <>{children}</>;
}

/** Splash/login/cadastro: quem já tem sessão vai direto para Explorar (ou o passo pendente). */
export function PublicOnly({ children }: { children: ReactNode }): JSX.Element {
  const { data: me, isLoading } = useMe();
  const loc = useLocation();
  if (isLoading) return <Loading />;
  if (me) {
    return <Navigate to={me.needsConsent ? '/consentimento' : me.onboarded ? safeNext(loc.search) : '/onboarding/tipos'} replace />;
  }
  return <>{children}</>;
}

/**
 * Destino pós-login. Home é sempre Explorar.
 * Só honra `?next=` para deep link de evento/código (ex.: confirmar presença).
 * Ignora /meus-roles, /perfil, /organizar etc.
 */
export const safeNext = (search: string, fallback = '/explorar'): string => {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  if (next.startsWith('/app/') || next === '/codigo' || next.startsWith('/codigo?')) return next;
  return fallback;
};
