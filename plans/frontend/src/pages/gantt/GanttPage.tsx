import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dependencies, plans, responsibleById, units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Panel } from '../../components/ui/Panel';
import { UnitDrawer } from '../../components/ui/UnitDrawer';

function dayOffset(date: string) {
  const start = new Date('2026-08-25').getTime();
  const d = new Date(date).getTime();
  return Math.max(0, Math.round((d - start) / 86400000));
}

export function GanttPage() {
  const [planId, setPlanId] = useState('plan-default');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tasks = useMemo(() => units.filter((u) => u.planId === planId && !u.archived), [planId]);
  const dated = tasks.filter((t) => t.start && t.end);
  const undated = tasks.filter((t) => !t.start || !t.end);
  const selected = units.find((u) => u.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        title="Plano / Gantt"
        subtitle="Ordens no tempo, dependências, roll-up e execução via AIs."
        actions={
          <div className="row gap">
            <Link className="btn ghost" to="/gantt/fop">
              Editor FOP
            </Link>
            <Link className="btn ghost" to="/gantt/maquina">
              Máquina
            </Link>
            <Link className="btn" to="/gantt/exportar">
              Exportar
            </Link>
          </div>
        }
      />

      <div className="row gap wrap" style={{ marginBottom: '1rem' }}>
        <label className="inline">
          Plano
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isDefault ? ' (padrão)' : ''}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn">
          Executar via AIs
        </button>
        <button type="button" className="btn ghost">
          Cancelar
        </button>
        <button type="button" className="btn ghost">
          Retry falhas
        </button>
      </div>

      <Panel title="Eixo temporal (fuso do projeto)">
        <div className="gantt">
          <div className="gantt-axis">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i}>D+{i}</span>
            ))}
          </div>
          {dated.map((t) => {
            const left = dayOffset(t.start!);
            const width = Math.max(1, dayOffset(t.end!) - left + 1);
            const resp = responsibleById(t.responsibleId);
            return (
              <button type="button" key={t.id} className="gantt-row" onClick={() => setSelectedId(t.id)}>
                <div className="gantt-label">
                  {t.parentId ? '↳ ' : ''}
                  {t.title}
                  <div className="row gap">
                    {resp ? <Badge tone="info">{resp.type}</Badge> : null}
                    {t.aiStatus ? (
                      <Badge tone={t.aiStatus === 'falhou' ? 'danger' : 'exec'}>{t.aiStatus}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="gantt-track">
                  <div className="gantt-bar" style={{ left: `${left * 12.5}%`, width: `${width * 12.5}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <Panel title="Sem datas (sinalizadas)">
          {undated.length === 0 ? (
            <p className="muted">Nenhuma tarefa sem data neste plano.</p>
          ) : (
            <ul>
              {undated.map((t) => (
                <li key={t.id}>
                  <button type="button" className="linkish" onClick={() => setSelectedId(t.id)}>
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Dependências">
          <ul>
            {dependencies
              .filter((d) => tasks.some((t) => t.id === d.fromId) && tasks.some((t) => t.id === d.toId))
              .map((d) => (
                <li key={`${d.fromId}-${d.toId}`}>
                  {d.fromId} → {d.toId} <Badge>{d.kind}</Badge>
                </li>
              ))}
          </ul>
        </Panel>
      </div>

      {selected ? <UnitDrawer unit={selected} view="gantt" onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
