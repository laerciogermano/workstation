import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';

export function ProductImportPage() {
  return (
    <>
      <PageHeader
        title="Importação da central de dados"
        description="Importar ou reimportar planilha EQP com SKUs e PMAs."
        screenId="TELA-04"
        stories="US-02"
        breadcrumbs={[{ label: 'Produtos', to: '/produtos' }, { label: 'Importação' }]}
      />
      <Panel title="Upload">
        <div className="upload-zone">
          <p>Arraste a planilha EQP ou clique para selecionar</p>
          <input type="file" accept=".xlsx,.xls,.csv" style={{ marginTop: '1rem' }} />
        </div>
        <div className="actions-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary">Baixar modelo</button>
          <button type="button" className="btn btn-primary">Validar e importar</button>
        </div>
      </Panel>
      <Panel title="Pré-visualização">
        <DataTable
          keyField="sku"
          data={[
            { sku: 'AC200MAX-127V', voltage: '127V', pmaPremium: 8999, pmaClassic: 8499 },
            { sku: 'AC200MAX-220V', voltage: '220V', pmaPremium: 9299, pmaClassic: 8799 },
          ]}
          columns={[
            { key: 'sku', header: 'SKU' },
            { key: 'voltage', header: 'Voltagem' },
            { key: 'pmaPremium', header: 'PMA Premium', render: (r) => `R$ ${r.pmaPremium}` },
            { key: 'pmaClassic', header: 'PMA Clássico', render: (r) => `R$ ${r.pmaClassic}` },
          ]}
        />
      </Panel>
      <Panel title="Histórico de importações">
        <DataTable
          keyField="id"
          data={[{ id: '1', date: '2026-08-25 10:00', user: 'Ana Silva', file: 'EQP-agosto.xlsx', result: '12 atualizados, 0 erros' }]}
          columns={[
            { key: 'date', header: 'Data' },
            { key: 'user', header: 'Usuário' },
            { key: 'file', header: 'Arquivo' },
            { key: 'result', header: 'Resultado' },
          ]}
        />
      </Panel>
      <Link to="/produtos" className="btn btn-secondary">Voltar</Link>
    </>
  );
}
