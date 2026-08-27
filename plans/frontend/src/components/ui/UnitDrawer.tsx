import { Link } from 'react-router-dom';
import { responsibleById, type WorkUnit } from '../../data/mockData';
import { Badge } from './Badge';

const viewLabel: Record<string, string> = {
  board: 'card',
  gantt: 'tarefa',
  tree: 'atividade',
};

export function UnitDrawer({
  unit,
  view,
  onClose,
}: {
  unit: WorkUnit;
  view: keyof typeof viewLabel;
  onClose: () => void;
}) {
  const resp = responsibleById(unit.responsibleId);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="muted">Detalhe · {viewLabel[view]}</div>
            <h2>{unit.title}</h2>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="drawer-body">
          <label>
            UUID
            <input readOnly value={unit.id} />
          </label>
          <label>
            Título
            <input defaultValue={unit.title} />
          </label>
          <label>
            Contexto
            <textarea defaultValue={unit.context ?? ''} rows={3} />
          </label>
          <label>
            Responsável
            <select defaultValue={unit.responsibleId ?? ''}>
              <option value="">Nenhum</option>
              <option value="p1">Ana Silva (pessoa)</option>
              <option value="p2">Bruno Costa (pessoa)</option>
              <option value="a1">Research Agent (IA)</option>
              <option value="a2">Code Agent (IA)</option>
              <option value="m1">Node Runner (máquina)</option>
              <option value="m2">File Worker (máquina)</option>
            </select>
          </label>
          <div className="row gap">
            <Badge tone={unit.archived ? 'warn' : 'ok'}>{unit.archived ? 'arquivada' : 'ativa'}</Badge>
            {resp ? <Badge tone="info">{resp.type}: {resp.name}</Badge> : null}
            {unit.aiStatus ? <Badge tone={unit.aiStatus === 'falhou' ? 'danger' : 'exec'}>{unit.aiStatus}</Badge> : null}
          </div>
          {unit.outputs?.length ? (
            <div>
              <h3>Saídas / artefatos</h3>
              <ul>
                {unit.outputs.map((o) => (
                  <li key={o.ref}>
                    <strong>{o.name}</strong> — <code>{o.ref}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="view-switch">
            <span className="muted">Abrir no</span>
            <Link to="/">Board</Link>
            <Link to="/gantt">Gantt</Link>
            <Link to="/arvore">Árvore</Link>
            <span className="muted">Explorar (painel)</span>
          </div>
          <div className="row gap">
            <button type="button" className="btn">
              Salvar
            </button>
            <button type="button" className="btn ghost">
              {unit.archived ? 'Desarquivar' : 'Arquivar'}
            </button>
            <button type="button" className="btn danger">
              Excluir
            </button>
          </div>
          <p className="muted small">Merge de unidades indisponível em v1.</p>
        </div>
      </aside>
    </div>
  );
}
