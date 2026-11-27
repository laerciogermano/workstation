import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import './styles.css';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ApiError } from './api';

try { document.documentElement.dataset.tema = localStorage.getItem('tema-125') || 'bordo'; } catch { /* sem armazenamento */ }

// sessão que caiu em qualquer chamada volta para a entrada
const expired = (e: unknown) => { if (e instanceof ApiError && e.status === 401) client.setQueryData(['me'], null); };
const client: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: expired }),
  mutationCache: new MutationCache({ onError: expired }),
  defaultOptions: { queries: { retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2, staleTime: 0 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={client}><BrowserRouter><App /></BrowserRouter></QueryClientProvider></StrictMode>,
);
