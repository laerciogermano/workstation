import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { BoardPage } from './pages/board/BoardPage';
import { GanttPage } from './pages/gantt/GanttPage';
import { TreePage } from './pages/tree/TreePage';
import { ExploreListPage } from './pages/explore/ExploreListPage';
import { ExploreDetailPage } from './pages/explore/ExploreDetailPage';
import { CatalogPage } from './pages/settings/CatalogPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<BoardPage />} />
          <Route path="gantt" element={<GanttPage />} />
          <Route path="arvore" element={<TreePage />} />
          <Route path="explorar" element={<ExploreListPage />} />
          <Route path="explorar/:id" element={<ExploreDetailPage />} />
          <Route path="configuracoes/catalogo" element={<CatalogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
