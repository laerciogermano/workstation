import { createBrowserRouter } from 'react-router';
import { Shell } from './Shell';
import { NotFound } from './NotFound';
import { lazyPage } from '../lib/lazy-page';

// code-splitting por feature (home + busca no bundle inicial: teclado abre no mesmo toque)
import { HomePage } from '../features/produtos/HomePage';
import SearchPage from '../features/produtos/SearchPage';

const ProductPage = lazyPage(() => import('../features/produtos/ProductPage'));
const ProductsMapPage = lazyPage(() => import('../features/produtos/ProductsMapPage'));
const ProductNearbyMapPage = lazyPage(() => import('../features/produtos/ProductNearbyMapPage'));
const ScanPage = lazyPage(() => import('../features/nota/ScanPage'));
const ReceiptResultPage = lazyPage(() => import('../features/nota/ReceiptResultPage'));
const StoresPage = lazyPage(() => import('../features/lojas/StoresPage'));
const StoresMapPage = lazyPage(() => import('../features/lojas/StoresMapPage'));
const StorePage = lazyPage(() => import('../features/lojas/StorePage'));
const ListsPage = lazyPage(() => import('../features/listas/ListsPage'));
const ListPage = lazyPage(() => import('../features/listas/ListPage'));
const MyReceiptsPage = lazyPage(() => import('../features/notas/MyReceiptsPage'));
const SpendingPage = lazyPage(() => import('../features/notas/SpendingPage'));
const ProfilePage = lazyPage(() => import('../features/conta/ProfilePage'));
const PointsPage = lazyPage(() => import('../features/conta/PointsPage'));
const AuthPages = lazyPage(() => import('../features/conta/AuthPages'));
const LocationPage = lazyPage(() => import('../features/conta/LocationPage'));
const DeleteAccountPage = lazyPage(() => import('../features/conta/DeleteAccountPage'));
const AdminPage = lazyPage(() => import('../features/admin/AdminPage'));

/** Rotas ↔ telas do protótipo v2 (T-xx). */
export const router = createBrowserRouter([
  { path: '/admin/*', element: <AdminPage /> }, // T-61..63 (desktop, fora do shell)
  {
    element: <Shell />,
    children: [
      { path: '/', element: <HomePage /> }, // T-10 · T-73
      { path: '/busca', element: <SearchPage /> }, // T-11 · T-72
      { path: '/mapa', element: <ProductsMapPage /> }, // T-15
      { path: '/produto/:gtin/mapa', element: <ProductNearbyMapPage /> }, // T-30 expansão
      { path: '/produto/:gtin', element: <ProductPage /> }, // T-14 · T-12 · T-13
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
