import { Link } from 'react-router-dom';
import { units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';

export function FopEditorPage() {
  const steps = units.filter((u) => u.planId === 'plan-default' && !u.archived && u.start);
  return (
    <div>
      <PageHeader
        title="Editor FOP"
        subtitle="Estado (entradas/saídas) + procedimentos; seleção, repetição, camadas e contexto."
        actions={
          <div className="row gap">
            <Link className="btn ghost" to="/gantt">
              Voltar ao Gantt
            </Link>
            <Link className="btn" to="/gantt/exportar">
              Exportar
            </Link>
          </div>
        }
      />

      <div className="grid-2">
        <Panel title="Canvas do fluxo">
          <div className="fop-flow">
            {steps.map((s, i) => (
              <div key={s.id} className="fop-node">
                <strong>{s.title}</strong>
                <div className="muted small">{s.id}</div>
                {s.outputs?.map((o) => (
                  <div key={o.ref} className="fop-port">
                    out · {o.name}
                  </div>
                ))}
                {i < steps.length - 1 ? <div className="fop-arrow">↓ ligação</div> : null}
              </div>
            ))}
          </div>
          <div className="row gap wrap" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn ghost">
              + Seleção
            </button>
            <button type="button" className="btn ghost">
              + Repetição
            </button>
            <button type="button" className="btn ghost">
              Ligar artefatos
            </button>
          </div>
        </Panel>

        <Panel title="Validação">
          <ul className="stack">
            <li>
              <Badge tone="ok">contexto completo</Badge> entradas necessárias presentes
            </li>
            <li>
              <Badge tone="warn">órfãos</Badge> 1 saída sem consumidor — aviso, não bloqueia
            </li>
            <li>
              <Badge tone="ok">ciclo de estado</Badge> nenhum ciclo detectado
            </li>
            <li>
              <Badge tone="info">camadas</Badge> endereços conhecidos compartilham camada
            </li>
          </ul>
          <button type="button" className="btn" style={{ marginTop: '1rem' }}>
            Validar plano
          </button>
        </Panel>
      </div>
    </div>
  );
}
