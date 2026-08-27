import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { BoardPage } from './pages/board/BoardPage';
import { BoardConfigPage } from './pages/board/BoardConfigPage';
import { GanttPage } from './pages/gantt/GanttPage';
import { FopEditorPage } from './pages/gantt/FopEditorPage';
import { MachineEditorPage } from './pages/gantt/MachineEditorPage';
import { ExportPage } from './pages/gantt/ExportPage';
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
          <Route path="board/config" element={<BoardConfigPage />} />
          <Route path="gantt" element={<GanttPage />} />
          <Route path="gantt/fop" element={<FopEditorPage />} />
          <Route path="gantt/maquina" element={<MachineEditorPage />} />
          <Route path="gantt/exportar" element={<ExportPage />} />
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
