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
    const next = new URLSearchParams(loc.search).get('next');
    const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/explorar';
    return <Navigate to={me.needsConsent ? '/consentimento' : me.onboarded ? safe : '/onboarding/tipos'} replace />;
  }
  return <>{children}</>;
}

export const safeNext = (search: string, fallback = '/explorar'): string => {
  const next = new URLSearchParams(search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
};
