import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { ApiError } from './lib/api.ts';
import { CampaignPage } from './pages/CampaignPage.tsx';
import { CampaignsPage } from './pages/CampaignsPage.tsx';
import { ListPage } from './pages/ListPage.tsx';
import { ListsPage } from './pages/ListsPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      staleTime: 5_000,
    },
  },
});

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/campanhas" replace /> },
      { path: 'campanhas', element: <CampaignsPage /> },
      { path: 'campanhas/:id', element: <CampaignPage /> },
      { path: 'listas', element: <ListsPage /> },
      { path: 'listas/:id', element: <ListPage /> },
      { path: '*', element: <Navigate to="/campanhas" replace /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
