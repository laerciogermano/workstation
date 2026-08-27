import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductListPage } from './pages/products/ProductListPage';
import { ProductFormPage } from './pages/products/ProductFormPage';
import { ProductImportPage } from './pages/products/ProductImportPage';
import { AdListPage } from './pages/monitoring/AdListPage';
import { AdDetailPage } from './pages/monitoring/AdDetailPage';
import { PriceMappingPage } from './pages/monitoring/PriceMappingPage';
import { SearchHistoryPage } from './pages/monitoring/SearchHistoryPage';
import { ScanLogPage } from './pages/monitoring/ScanLogPage';
import { OccurrenceListPage } from './pages/enforcement/OccurrenceListPage';
import { OccurrenceDetailPage } from './pages/enforcement/OccurrenceDetailPage';
import { UnregisteredSellersPage } from './pages/enforcement/UnregisteredSellersPage';
import { PartnerListPage } from './pages/partners/PartnerListPage';
import { PartnerFormPage } from './pages/partners/PartnerFormPage';
import { ComplianceRankingPage } from './pages/reports/ComplianceRankingPage';
import { ChannelsPage } from './pages/settings/ChannelsPage';
import { PmaRulesPage } from './pages/settings/PmaRulesPage';
import { ReportsAlertsPage } from './pages/settings/ReportsAlertsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="produtos" element={<ProductListPage />} />
          <Route path="produtos/novo" element={<ProductFormPage />} />
          <Route path="produtos/importacao" element={<ProductImportPage />} />
          <Route path="produtos/:id" element={<ProductFormPage />} />
          <Route path="monitoramento/anuncios" element={<AdListPage />} />
          <Route path="monitoramento/anuncios/:id" element={<AdDetailPage />} />
          <Route path="monitoramento/mapeamento" element={<PriceMappingPage />} />
          <Route path="monitoramento/historico" element={<SearchHistoryPage />} />
          <Route path="monitoramento/log" element={<ScanLogPage />} />
          <Route path="fiscalizacao/ocorrencias" element={<OccurrenceListPage />} />
          <Route path="fiscalizacao/ocorrencias/:id" element={<OccurrenceDetailPage />} />
          <Route path="fiscalizacao/nao-cadastrados" element={<UnregisteredSellersPage />} />
          <Route path="parceiros" element={<PartnerListPage />} />
          <Route path="parceiros/novo" element={<PartnerFormPage />} />
          <Route path="parceiros/:id" element={<PartnerFormPage />} />
          <Route path="relatorios/ranking" element={<ComplianceRankingPage />} />
          <Route path="configuracoes/canais" element={<ChannelsPage />} />
          <Route path="configuracoes/pma" element={<PmaRulesPage />} />
          <Route path="configuracoes/alertas" element={<ReportsAlertsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
