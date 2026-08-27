import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { getPartner } from '../../data/mockData';

export function PartnerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const partner = id && id !== 'novo' ? getPartner(id) : undefined;

  return (
    <>
      <PageHeader
        title={partner ? 'Editar parceiro' : 'Novo parceiro'}
        screenId="TELA-15"
        stories="US-18"
        breadcrumbs={[{ label: 'Parceiros', to: '/parceiros' }, { label: partner ? 'Editar' : 'Novo' }]}
      />
      {partner && (
        <Panel title="Resumo">
          <div className="indicators-row">
            <span>Ocorrências recentes: <strong>{partner.openOccurrences}</strong></span>
            <span>Conformidade: <strong>{partner.compliance}%</strong></span>
          </div>
        </Panel>
      )}
      <Panel title="Dados cadastrais">
        <div className="form-grid">
          <div className="field"><label>Razão social</label><input defaultValue={partner?.legalName} /></div>
          <div className="field"><label>Nome fantasia</label><input defaultValue={partner?.tradeName} /></div>
          <div className="field"><label>CNPJ</label><input defaultValue={partner?.cnpj} /></div>
          <div className="field"><label>E-mail</label><input defaultValue={partner?.email} /></div>
          <div className="field"><label>Telefone</label><input defaultValue={partner?.phone} /></div>
        </div>
      </Panel>
      <Panel title="Relacionamento comercial">
        <div className="form-grid">
          <div className="field"><label>Distribuidor</label><input defaultValue={partner?.distributor} /></div>
          <div className="field">
            <label>Status</label>
            <select defaultValue={partner?.status ?? 'ativo'}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
          </div>
        </div>
      </Panel>
      <Panel title="Canais e portfólio">
        <div className="form-grid">
          <div className="field"><label>Marketplaces</label><input defaultValue={partner?.marketplaces.join(', ')} placeholder="ML, Amazon…" /></div>
          <div className="field"><label>SKUs comercializados</label><input placeholder="AC200MAX-127V, EB3A-127V" /></div>
        </div>
      </Panel>
      <div className="actions-row">
        <button type="button" className="btn btn-primary" onClick={() => navigate('/parceiros')}>Salvar</button>
        <Link to="/parceiros" className="btn btn-secondary">Cancelar</Link>
        {partner && <button type="button" className="btn btn-danger">Inativar</button>}
      </div>
    </>
  );
}
