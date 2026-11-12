import '@fontsource-variable/archivo';
import './styles/app.css';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

/**
 * Offline-first (RNF-04): o cache das queries persiste no aparelho, então hoje/dieta/treino abrem
 * sem rede; mutações ficam pausadas e retomam quando a conexão volta.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, gcTime: 24 * 60 * 60_000, networkMode: 'offlineFirst', refetchOnWindowFocus: true },
    mutations: { networkMode: 'online', retry: 2 },
  },
});
const persister = createSyncStoragePersister({ storage: window.localStorage, key: 'ft-cache' });

const root = document.getElementById('root');
if (!root) throw new Error('#root ausente');
createRoot(root).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60_000, buster: 'v1' }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
