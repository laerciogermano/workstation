import './styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import { router } from './app/router';
import { refreshSession } from './lib/api';
import { ApiError } from './lib/api';
import { installAppGestures } from './lib/app-gestures';
import { clearChunkReloadFlag } from './lib/lazy-page';
import { session } from './lib/session';
import { installViewportHeightLock } from './lib/viewport-height';
import { ToastProvider } from './ui/Toast';
import { applyTheme } from './lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
      refetchOnWindowFocus: false,
    },
  },
});

installViewportHeightLock();
installAppGestures();
applyTheme();
clearChunkReloadFlag();
// autoUpdate: novo SW → skipWaiting + reload (evita shell antigo pedindo chunks apagados)
registerSW({ immediate: true });
// sessão silenciosa: se houver cookie de refresh, já entra logado (cookie ~30 dias)
await refreshSession().catch(() => false);
// volta do background sem access em memória: restaura pelo cookie
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !session.token) void refreshSession().catch(() => false);
});

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
