import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';

export function PmaRulesPage() {
  return (
    <>
      <PageHeader title="Regras de PMA e exceções" description="PMA por canal, escopo e campanhas." screenId="TELA-06" stories="US-06, US-19" />
      <Panel title="Regras por canal e modalidade">
        <div className="form-grid">
          <div className="field"><label>Mercado Livre Premium</label><select><option>PMA Premium cadastrado</option></select></div>
          <div className="field"><label>Mercado Livre Clássico</label><select><option>PMA Clássico cadastrado</option></select></div>
          <div className="field"><label>Shopee</label><input defaultValue="-8%" readOnly /></div>
          <div className="field"><label>Magalu Clássico</label><select><option>PMA Clássico cadastrado</option></select></div>
          <div className="field"><label>Efeito parcelamento</label><select><option>Considerar preço efetivo</option></select></div>
        </div>
      </Panel>
      <Panel title="Simulador">
        <div className="form-grid">
          <div className="field"><label>Produto</label><select><option>AC200MAX-127V</option></select></div>
          <div className="field"><label>Canal</label><select><option>Shopee</option></select></div>
          <div className="field"><label>Modalidade</label><select><option>Padrão</option></select></div>
        </div>
        <p style={{ marginTop: '0.75rem' }}>PMA aplicável: <strong>R$ 8.279,08</strong></p>
      </Panel>
      <Panel title="Regras e exceções ativas">
        <DataTable
          keyField="id"
          data={[
            { id: '1', scope: 'SKU AC200MAX-127V', type: 'PMA', channel: '—', valid: '2026-01-01 — —' },
            { id: '2', scope: 'TechPower SP', type: 'Exceção campanha', channel: 'ML', valid: '2026-08-01 — 2026-08-31' },
          ]}
          columns={[
            { key: 'scope', header: 'Escopo' },
            { key: 'type', header: 'Tipo' },
            { key: 'channel', header: 'Canal' },
            { key: 'valid', header: 'Vigência' },
            { key: 'actions', header: '', render: () => <button type="button" className="btn btn-sm btn-secondary">Editar</button> },
          ]}
        />
        <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Nova regra / exceção</button>
      </Panel>
      <Panel title="Histórico de regras">
        <ul className="timeline">
          <li>2026-08-01 — PMA Premium AC200MAX alterado para R$ 8.999</li>
          <li>2026-06-15 — Exceção campanha TechPower encerrada</li>
        </ul>
      </Panel>
    </>
  );
}
