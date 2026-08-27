import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { ads } from '../../data/mockData';

export function SearchHistoryPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [granularity, setGranularity] = useState('dia');
  const exportModal = useExportModal();

  return (
    <>
      <PageHeader title="Histórico de pesquisas e preços" description="Tendências e reincidência." screenId="TELA-11" stories="US-16, US-23" />
      <FiltersBar
        fields={[
          { name: 'partner', label: 'Empresa / parceiro', placeholder: 'Nome ou CNPJ' },
          { name: 'sku', label: 'SKU', placeholder: 'SKU' },
          { name: 'period', label: 'Período', type: 'date' },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="tabs">
        {['dia', 'semana', 'mês'].map((g) => (
          <button key={g} type="button" className={`tab ${granularity === g ? 'active' : ''}`} onClick={() => setGranularity(g)}>{g}</button>
        ))}
      </div>
      <Panel title="Evolução de preços">
        <div className="chart-placeholder">Gráfico — preço mínimo, médio e PMA</div>
      </Panel>
      <Panel title="Destaques">
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
          <li>Reincidência: TechPower SP — 2 violações no período</li>
          <li>Queda abrupta: Shopee — −5% em 24h</li>
        </ul>
      </Panel>
      <Panel title="Tabela histórica">
        <DataTable
          keyField="id"
          data={ads.map((a) => ({ ...a, collectedAt: a.collectedAt }))}
          columns={[
            { key: 'collectedAt', header: 'Data' },
            { key: 'title', header: 'Anúncio', render: (r) => <Link to={`/monitoramento/anuncios/${r.id}`}>{String(r.title).slice(0, 40)}…</Link> },
            { key: 'price', header: 'Preço', render: (r) => `R$ ${r.price}` },
            { key: 'pmaApplied', header: 'PMA', render: (r) => `R$ ${r.pmaApplied}` },
            { key: 'classification', header: 'Classificação' },
            { key: 'seller', header: 'Vendedor' },
          ]}
        />
      </Panel>
      <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar histórico</button>
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar histórico" />
    </>
  );
}
