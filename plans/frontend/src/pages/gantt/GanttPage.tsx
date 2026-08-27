import { useMemo, useState } from 'react';
import { dependencies, plans, responsibleById, unitById, units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Panel } from '../../components/ui/Panel';
import { UnitDrawer } from '../../components/ui/UnitDrawer';

type Mode = 'tempo' | 'fop' | 'maquina' | 'exportar';

function dayOffset(date: string) {
  const start = new Date('2026-08-25').getTime();
  const d = new Date(date).getTime();
  return Math.max(0, Math.round((d - start) / 86400000));
}

const sampleIr = `{
  "kind": "fop-ir",
  "plan": "plan-default",
  "nodes": [
    { "id": "u2", "fn": "definirOrcamento" },
    { "id": "u3", "fn": "compararModelos" }
  ],
  "edges": [{ "from": "u2.out", "to": "u3.in" }]
}`;

export function GanttPage() {
  const [planId, setPlanId] = useState('plan-default');
  const [mode, setMode] = useState<Mode>('tempo');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const machine = unitById('u5')!;
  const [code, setCode] = useState(machine.machineCode ?? '');
  const [ran, setRan] = useState(false);
  const [dest, setDest] = useState<'ir' | 'ts' | 'py'>('ir');
  const [preview, setPreview] = useState<string | null>(null);

  const tasks = useMemo(() => units.filter((u) => u.planId === planId && !u.archived), [planId]);
  const dated = tasks.filter((t) => t.start && t.end);
  const undated = tasks.filter((t) => !t.start || !t.end);
  const selected = units.find((u) => u.id === selectedId) ?? null;
  const fopSteps = tasks.filter((t) => t.start);
  const invalidLib = /import\s+\w+\s+from\s+['"](?!stdio|fs|http)/.test(code);

  return (
    <div>
      <PageHeader
        title="Plano / Gantt"
        subtitle="Tempo, FOP, máquina e exportação na mesma superfície."
      />

      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {(
          [
            ['tempo', 'Tempo'],
            ['fop', 'FOP'],
            ['maquina', 'Máquina'],
            ['exportar', 'Exportar'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={mode === id ? 'tab active' : 'tab'}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

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
        {mode === 'tempo' ? (
          <>
            <button type="button" className="btn">
              Executar via AIs
            </button>
            <button type="button" className="btn ghost">
              Cancelar
            </button>
            <button type="button" className="btn ghost">
              Retry falhas
            </button>
          </>
        ) : null}
      </div>

      {mode === 'tempo' ? (
        <>
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
        </>
      ) : null}

      {mode === 'fop' ? (
        <div className="grid-2">
          <Panel title="Canvas do fluxo">
            <div className="fop-flow">
              {fopSteps.map((s, i) => (
                <div key={s.id} className="fop-node">
                  <strong>{s.title}</strong>
                  <div className="muted small">{s.id}</div>
                  {s.outputs?.map((o) => (
                    <div key={o.ref} className="fop-port">
                      out · {o.name}
                    </div>
                  ))}
                  {i < fopSteps.length - 1 ? <div className="fop-arrow">↓ ligação</div> : null}
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
                <Badge tone="ok">contexto completo</Badge>
              </li>
              <li>
                <Badge tone="warn">órfãos — aviso</Badge>
              </li>
              <li>
                <Badge tone="ok">sem ciclo de estado</Badge>
              </li>
            </ul>
            <button type="button" className="btn" style={{ marginTop: '1rem' }} onClick={() => setMode('exportar')}>
              Ir para exportar
            </button>
          </Panel>
        </div>
      ) : null}

      {mode === 'maquina' ? (
        <div className="grid-2">
          <Panel title={`Programa · ${machine.title}`}>
            <textarea className="code" rows={12} value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="row gap wrap" style={{ marginTop: '0.75rem' }}>
              <Badge tone="info">stdio</Badge>
              <Badge tone="info">fs</Badge>
              <Badge tone="info">http</Badge>
            </div>
            {invalidLib ? (
              <p className="danger-text">Biblioteca fora do conjunto v1.</p>
            ) : (
              <p className="muted small">Dentro do conjunto permitido.</p>
            )}
            <div className="row gap" style={{ marginTop: '0.75rem' }}>
              <button type="button" className="btn" disabled={invalidLib}>
                Salvar
              </button>
              <button type="button" className="btn ghost" disabled={invalidLib} onClick={() => setRan(true)}>
                Executar
              </button>
            </div>
          </Panel>
          <Panel title="Entradas / saídas">
            <ul>
              <li>
                in · <code>url</code>
              </li>
              {machine.outputs?.map((o) => (
                <li key={o.ref}>
                  out · <strong>{o.name}</strong>
                </li>
              ))}
            </ul>
            {ran ? (
              <div className="preview-box">
                <Badge tone="ok">concluída</Badge>
                <pre>{`{ "status": 200 }`}</pre>
              </div>
            ) : (
              <p className="muted">Execute para atualizar saídas.</p>
            )}
          </Panel>
        </div>
      ) : null}

      {mode === 'exportar' ? (
        <div className="grid-2">
          <Panel title="Consistência e destino">
            <ul className="stack">
              <li>
                <Badge tone="ok">sem ciclo</Badge>
              </li>
              <li>
                <Badge tone="warn">órfãos — aviso</Badge>
              </li>
            </ul>
            <label className="stack" style={{ marginTop: '1rem' }}>
              Destino
              <select value={dest} onChange={(e) => setDest(e.target.value as typeof dest)}>
                <option value="ir">FOP-IR</option>
                <option value="ts">TypeScript</option>
                <option value="py">Python</option>
              </select>
            </label>
            <div className="row gap" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setPreview(
                    dest === 'ir'
                      ? sampleIr
                      : dest === 'ts'
                        ? `export async function compararModelos(ctx: Ctx) {\n  return ctx;\n}`
                        : `async def comparar_modelos(ctx):\n    return ctx\n`,
                  )
                }
              >
                {dest === 'ir' ? 'Compilar FOP-IR' : 'Exportar'}
              </button>
              <button type="button" className="btn ghost" disabled={!preview}>
                Copiar / baixar
              </button>
            </div>
          </Panel>
          <Panel title="Pré-visualização">
            {preview ? <pre className="code-preview">{preview}</pre> : <p className="muted">Gere um artefato.</p>}
          </Panel>
        </div>
      ) : null}

      {selected ? <UnitDrawer unit={selected} view="gantt" onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
