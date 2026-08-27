import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { products } from '../../data/mockData';

export function ProductListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const exportModal = useExportModal();

  return (
    <>
      <PageHeader title="Lista de produtos" description="Base de produtos monitorados." screenId="TELA-02" stories="US-01, US-05, US-23" />
      <FiltersBar
        fields={[
          { name: 'search', label: 'Busca', placeholder: 'SKU, EAN, palavra-chave' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }] },
          { name: 'frequency', label: 'Frequência', type: 'select', options: [{ value: '6h', label: '6h' }, { value: '12h', label: '12h' }] },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="actions-row">
        <Link to="/produtos/novo" className="btn btn-primary">Novo produto</Link>
        <Link to="/produtos/importacao" className="btn btn-secondary">Importar planilha</Link>
        <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar</button>
      </div>
      <DataTable
        keyField="id"
        data={products}
        columns={[
          { key: 'name', header: 'Nome', render: (r) => <Link to={`/produtos/${r.id}`}>{String(r.name)}</Link> },
          { key: 'sku', header: 'SKU' },
          { key: 'ean', header: 'EAN' },
          { key: 'pmaPremium', header: 'PMA Premium', render: (r) => `R$ ${r.pmaPremium}` },
          { key: 'pmaClassic', header: 'PMA Clássico', render: (r) => `R$ ${r.pmaClassic}` },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ativo' ? 'success' : 'neutral'}>{String(r.status)}</Badge> },
          { key: 'frequency', header: 'Frequência' },
          { key: 'nextScan', header: 'Próxima varredura' },
          { key: 'actions', header: 'Ações', render: (r) => (
            <>
              <Link to={`/produtos/${r.id}`} className="btn btn-sm btn-secondary">Editar</Link>{' '}
              <Link to={`/monitoramento/anuncios?sku=${r.sku}`} className="btn btn-sm btn-secondary">Anúncios</Link>
            </>
          )},
        ]}
      />
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar produtos" />
    </>
  );
}
