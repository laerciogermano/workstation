import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, classificationBadge } from '../../components/ui/Badge';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { ads, products } from '../../data/mockData';

export function PriceMappingPage() {
  const [sku, setSku] = useState(products[0]?.sku ?? '');
  const exportModal = useExportModal();
  const skuAds = ads.filter((a) => products.find((p) => p.id === a.productId)?.sku === sku);

  return (
    <>
      <PageHeader title="Mapeamento de preços" description="Visão consolidada por SKU." screenId="TELA-10" stories="US-09, US-15, US-23" />
      <div className="filters-bar">
        <div className="field">
          <label htmlFor="sku">Produto / SKU</label>
          <select id="sku" value={sku} onChange={(e) => setSku(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mp">Marketplace</label>
          <select id="mp"><option value="">Todos</option><option>Mercado Livre</option><option>Shopee</option></select>
        </div>
      </div>
      <Panel title="Grade por marketplace">
        <DataTable
          keyField="marketplace"
          data={[
            { marketplace: 'Mercado Livre', min: 8799, avg: 9100, count: 4, seller: 'TechPower SP' },
            { marketplace: 'Shopee', min: 8100, avg: 8350, count: 2, seller: 'Loja Desconhecida' },
          ]}
          columns={[
            { key: 'marketplace', header: 'Marketplace' },
            { key: 'min', header: 'Menor preço', render: (r) => `R$ ${r.min}` },
            { key: 'avg', header: 'Preço médio', render: (r) => `R$ ${r.avg}` },
            { key: 'count', header: 'Anúncios' },
            { key: 'seller', header: 'Menor preço — vendedor' },
          ]}
        />
      </Panel>
      <div className="chart-placeholder" style={{ marginBottom: '1rem' }}>Comparativo PMA vs menor preço vs preço recomendado</div>
      <div className="two-col">
        <Panel title="Anúncios regulares">
          <DataTable keyField="id" data={skuAds.filter((a) => a.classification === 'regular')} columns={[
            { key: 'title', header: 'Anúncio', render: (r) => <Link to={`/monitoramento/anuncios/${r.id}`}>{String(r.title)}</Link> },
            { key: 'price', header: 'Preço', render: (r) => `R$ ${r.price}` },
          ]} emptyMessage="Nenhum regular." />
        </Panel>
        <Panel title="Anúncios irregulares">
          <DataTable keyField="id" data={skuAds.filter((a) => a.classification === 'irregular')} columns={[
            { key: 'title', header: 'Anúncio', render: (r) => <Link to={`/monitoramento/anuncios/${r.id}`}>{String(r.title)}</Link> },
            { key: 'price', header: 'Preço', render: (r) => `R$ ${r.price}` },
            { key: 'classification', header: '', render: (r) => <Badge variant={classificationBadge(String(r.classification))}>{String(r.classification)}</Badge> },
          ]} emptyMessage="Nenhum irregular." />
        </Panel>
      </div>
      <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar mapeamento</button>
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar mapeamento" />
    </>
  );
}
