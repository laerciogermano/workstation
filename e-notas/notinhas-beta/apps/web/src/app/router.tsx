import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { Shell } from './Shell';
import { NotFound } from './NotFound';

// code-splitting por feature (só a home entra no bundle inicial)
import { HomePage } from '../features/produtos/HomePage';
const SearchPage = lazy(() => import('../features/produtos/SearchPage'));
const ProductPage = lazy(() => import('../features/produtos/ProductPage'));
const ProductsMapPage = lazy(() => import('../features/produtos/ProductsMapPage'));
const ScanPage = lazy(() => import('../features/nota/ScanPage'));
const ReceiptResultPage = lazy(() => import('../features/nota/ReceiptResultPage'));
const StoresPage = lazy(() => import('../features/lojas/StoresPage'));
const StoresMapPage = lazy(() => import('../features/lojas/StoresMapPage'));
const StorePage = lazy(() => import('../features/lojas/StorePage'));
const ListsPage = lazy(() => import('../features/listas/ListsPage'));
const ListPage = lazy(() => import('../features/listas/ListPage'));
const MyReceiptsPage = lazy(() => import('../features/notas/MyReceiptsPage'));
const SpendingPage = lazy(() => import('../features/notas/SpendingPage'));
const ProfilePage = lazy(() => import('../features/conta/ProfilePage'));
const PointsPage = lazy(() => import('../features/conta/PointsPage'));
const AuthPages = lazy(() => import('../features/conta/AuthPages'));
const LocationPage = lazy(() => import('../features/conta/LocationPage'));
const DeleteAccountPage = lazy(() => import('../features/conta/DeleteAccountPage'));
const AdminPage = lazy(() => import('../features/admin/AdminPage'));

/** Rotas ↔ telas do protótipo v2 (T-xx). */
export const router = createBrowserRouter([
  { path: '/admin/*', element: <AdminPage /> }, // T-61..63 (desktop, fora do shell)
  {
    element: <Shell />,
    children: [
      { path: '/', element: <HomePage /> }, // T-10 · T-73
      { path: '/busca', element: <SearchPage /> }, // T-11 · T-72
      { path: '/mapa', element: <ProductsMapPage /> }, // T-15
      { path: '/produto/:gtin', element: <ProductPage /> }, // T-14 · T-12 · T-13 · T-30
      { path: '/nota', element: <ScanPage /> }, // T-20 · T-21 · T-70 · T-25 · T-27
      { path: '/notas/:id', element: <ReceiptResultPage /> }, // T-22 · T-26 · T-55 · T-23 · T-24
      { path: '/notas', element: <MyReceiptsPage /> }, // T-50
      { path: '/gastos', element: <SpendingPage /> }, // T-52
      { path: '/lojas', element: <StoresPage /> }, // T-31
      { path: '/lojas/mapa', element: <StoresMapPage /> }, // T-32
      { path: '/lojas/:id', element: <StorePage /> }, // T-33 · T-34
      { path: '/listas', element: <ListsPage /> }, // T-40
      { path: '/listas/:id', element: <ListPage /> }, // T-42 · T-41 · T-54
      { path: '/perfil', element: <ProfilePage /> }, // T-51
      { path: '/pontos', element: <PointsPage /> }, // T-53
      { path: '/perfil/localizacao', element: <LocationPage /> }, // T-05
      { path: '/perfil/excluir', element: <DeleteAccountPage /> }, // T-56
      { path: '/conta/:modo', element: <AuthPages /> }, // T-02 criar · T-03 entrar · T-04 recuperar · redefinir
      { path: '*', element: <NotFound /> },
    ],
  },
]);
