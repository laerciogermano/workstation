import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { unregisteredSellers } from '../../data/mockData';

export function UnregisteredSellersPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  return (
    <>
      <PageHeader title="Vendedores não cadastrados" description="Canal paralelo e distribuição não autorizada." screenId="TELA-16" stories="US-11" />
      <FiltersBar
        fields={[
          { name: 'marketplace', label: 'Marketplace', type: 'select', options: [{ value: 'shopee', label: 'Shopee' }] },
          { name: 'product', label: 'Produto', placeholder: 'SKU' },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <DataTable
        keyField="id"
        data={unregisteredSellers}
        columns={[
          { key: 'seller', header: 'Vendedor', render: (r) => <><Badge variant="warning">Recorrente</Badge> {String(r.seller)}</> },
          { key: 'marketplace', header: 'Canal' },
          { key: 'products', header: 'Produtos' },
          { key: 'ads', header: 'Anúncios' },
          { key: 'irregularities', header: 'Irregularidades' },
          { key: 'lastSeen', header: 'Última detecção' },
          { key: 'actions', header: 'Ações', render: () => (
            <>
              <Link to="/parceiros/novo" className="btn btn-sm btn-primary">Cadastrar</Link>{' '}
              <button type="button" className="btn btn-sm btn-secondary">Vincular</button>{' '}
              <Link to="/monitoramento/anuncios" className="btn btn-sm btn-secondary">Anúncios</Link>
            </>
          )},
        ]}
      />
    </>
  );
}
