import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Component, type JSX, lazy, type ReactNode, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { IconSprite } from '../ui/Icon';
import { ErrorState, Loading, ui } from '../ui/primitives';
import { ToastProvider } from '../ui/toast';
import { PublicOnly, RequireAdmin, RequireAuth } from './guards';

const Auth = lazy(() => import('../features/auth/routes'));
const Legal = lazy(() => import('../features/auth/routes').then((m) => ({ default: m.LegalPage })));
const Onboarding = lazy(() => import('../features/onboarding/routes'));
const Discovery = lazy(() => import('../features/discovery/routes'));
const EventRoutes = lazy(() => import('../features/event/routes'));
const MeRoutes = lazy(() => import('../features/me/routes'));
const Organizer = lazy(() => import('../features/organizer/routes'));
const Admin = lazy(() => import('../features/admin/routes'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  override state = { error: false };
  static getDerivedStateFromError(): { error: boolean } {
    return { error: true };
  }
  override render(): ReactNode {
    return this.state.error ? <ErrorState message="Algo deu errado nesta tela." onRetry={() => window.location.reload()} /> : this.props.children;
  }
}

const page = (el: JSX.Element) => (
  <Boundary>
    <Suspense fallback={<Loading />}>{el}</Suspense>
  </Boundary>
);

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <IconSprite />
        <div className={ui.app}>
          <BrowserRouter>
            <Routes>
              {/* Home = Explorar (visitante ou logado). Splash de marketing só em /bem-vindo. */}
              <Route path="/" element={page(<Discovery />)} />
              <Route path="/explorar/*" element={page(<Discovery />)} />
              <Route path="/bem-vindo" element={<Navigate to="/explorar" replace />} />
              <Route path="/cadastro" element={page(<PublicOnly><Auth view="register" /></PublicOnly>)} />
              <Route path="/entrar" element={page(<PublicOnly><Auth view="login" /></PublicOnly>)} />
              <Route path="/recuperar-senha" element={page(<Auth view="forgot" />)} />
              <Route path="/redefinir-senha" element={page(<Auth view="reset" />)} />
              <Route path="/verificar-email" element={page(<Auth view="verify" />)} />
              <Route path="/auth/google/callback" element={page(<Auth view="google" />)} />
              <Route path="/termos" element={page(<Legal kind="terms" />)} />
              <Route path="/privacidade" element={page(<Legal kind="privacy" />)} />
              <Route path="/consentimento" element={page(<RequireAuth allowOnboarding><Auth view="consent" /></RequireAuth>)} />
              <Route path="/onboarding/*" element={page(<RequireAuth allowOnboarding><Onboarding /></RequireAuth>)} />
              <Route path="/app/*" element={page(<EventRoutes />)} />
              <Route path="/codigo" element={page(<RequireAuth><EventRoutes view="code" /></RequireAuth>)} />
              <Route path="/meus-roles" element={page(<RequireAuth><MeRoutes view="mine" /></RequireAuth>)} />
              <Route path="/perfil/*" element={page(<RequireAuth><MeRoutes view="profile" /></RequireAuth>)} />
              <Route path="/organizar/*" element={page(<RequireAuth><Organizer /></RequireAuth>)} />
              <Route path="/admin/*" element={page(<RequireAdmin><Admin /></RequireAdmin>)} />
              <Route path="*" element={<Navigate to="/explorar" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}
