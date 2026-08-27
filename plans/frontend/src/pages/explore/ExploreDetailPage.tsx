import { Link, useParams } from 'react-router-dom';
import { responsibleById, unitById } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';

export function ExploreDetailPage() {
  const { id } = useParams();
  const unit = id ? unitById(id) : undefined;
  if (!unit) {
    return (
      <div>
        <PageHeader title="Arquivo não encontrado" />
        <Link to="/explorar">Voltar à lista</Link>
      </div>
    );
  }
  const resp = responsibleById(unit.responsibleId);

  return (
    <div>
      <PageHeader
        title={unit.title}
        subtitle="Persistência como arquivo — mesma entidade nas demais visões."
        actions={
          <Link className="btn ghost" to="/explorar">
            Voltar à lista
          </Link>
        }
      />

      <Panel title="Arquivo">
        <div className="form-grid">
          <label>
            UUID
            <input readOnly value={unit.id} />
          </label>
          <label>
            Título
            <input defaultValue={unit.title} />
          </label>
          <label className="full">
            Contexto
            <textarea defaultValue={unit.context ?? ''} rows={3} />
          </label>
          <label>
            Responsável
            <input readOnly value={resp ? `${resp.name} (${resp.type})` : 'nenhum'} />
          </label>
          <label>
            Ciclo de vida
            <div className="row gap">
              <Badge tone={unit.archived ? 'warn' : 'ok'}>{unit.archived ? 'arquivada' : 'ativa'}</Badge>
              {unit.archived ? (
                <button type="button" className="btn ghost">
                  Desarquivar
                </button>
              ) : null}
            </div>
          </label>
        </div>
        {unit.outputs?.length ? (
          <div style={{ marginTop: '1rem' }}>
            <h3>Saídas</h3>
            <ul>
              {unit.outputs.map((o) => (
                <li key={o.ref}>
                  {o.name} — <code>{o.ref}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="view-switch" style={{ marginTop: '1rem' }}>
          <span className="muted">Abrir no</span>
          <Link to="/">Board</Link>
          <Link to="/gantt">Gantt</Link>
          <Link to="/arvore">Árvore</Link>
        </div>
        <div className="row gap" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn">
            Salvar
          </button>
        </div>
      </Panel>
    </div>
  );
}
