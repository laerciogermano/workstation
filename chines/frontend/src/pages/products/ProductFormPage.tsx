import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { getProduct } from '../../data/mockData';

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = id && id !== 'novo' ? getProduct(id) : undefined;
  const isEdit = !!product;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Editar produto' : 'Novo produto'}
        description="Cadastro e configuração de monitoramento."
        screenId="TELA-03"
        stories="US-01, US-05"
        breadcrumbs={[{ label: 'Produtos', to: '/produtos' }, { label: isEdit ? 'Editar' : 'Novo' }]}
      />
      {isEdit && (
        <Panel title="Resumo">
          <div className="indicators-row">
            <span>Anúncios coletados: <strong>8</strong></span>
            <span>Ocorrências abertas: <strong>1</strong></span>
            <span>Última varredura: <strong>2026-08-26 14:00</strong></span>
          </div>
        </Panel>
      )}
      <Panel title="Identificação">
        <div className="form-grid">
          <div className="field"><label>Nome</label><input defaultValue={product?.name} /></div>
          <div className="field"><label>SKU *</label><input defaultValue={product?.sku} required /></div>
          <div className="field"><label>Código interno</label><input /></div>
          <div className="field"><label>EAN/GTIN</label><input defaultValue={product?.ean} /></div>
          <div className="field"><label>Modelo</label><input defaultValue={product?.model} /></div>
          <div className="field"><label>Categoria</label><input defaultValue={product?.category} /></div>
        </div>
      </Panel>
      <Panel title="Variações e busca">
        <div className="form-grid">
          <div className="field"><label>Variações</label><input placeholder="127V, 220V" /></div>
          <div className="field"><label>Palavras-chave</label><input placeholder="bluetti, ac200max" /></div>
        </div>
      </Panel>
      <Panel title="Preços">
        <div className="form-grid">
          <div className="field"><label>PMA Premium *</label><input type="number" defaultValue={product?.pmaPremium} /></div>
          <div className="field"><label>PMA Clássico *</label><input type="number" defaultValue={product?.pmaClassic} /></div>
          <div className="field"><label>Preço recomendado</label><input type="number" defaultValue={product?.recommendedPrice} /></div>
        </div>
      </Panel>
      <Panel title="Monitoramento">
        <div className="form-grid">
          <div className="field">
            <label>Status</label>
            <select defaultValue={product?.status ?? 'ativo'}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>
          <div className="field"><label>Data início</label><input type="date" defaultValue={product?.startDate} /></div>
          <div className="field">
            <label>Frequência</label>
            <select defaultValue={product?.frequency ?? '6h'}>
              <option value="1h">1h</option>
              <option value="3h">3h</option>
              <option value="6h">6h</option>
              <option value="12h">12h</option>
              <option value="diária">Diária</option>
            </select>
          </div>
        </div>
      </Panel>
      <div className="actions-row">
        <button type="button" className="btn btn-primary" onClick={() => navigate('/produtos')}>Salvar</button>
        <Link to="/produtos" className="btn btn-secondary">Cancelar</Link>
        {isEdit && (
          <>
            <Link to={`/monitoramento/anuncios?sku=${product?.sku}`} className="btn btn-secondary">Ver anúncios</Link>
            <Link to="/monitoramento/historico" className="btn btn-secondary">Histórico</Link>
          </>
        )}
      </div>
    </>
  );
}
