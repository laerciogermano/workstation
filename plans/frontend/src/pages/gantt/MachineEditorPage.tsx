import { useState } from 'react';
import { Link } from 'react-router-dom';
import { unitById } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';

export function MachineEditorPage() {
  const unit = unitById('u5')!;
  const [code, setCode] = useState(unit.machineCode ?? '');
  const [ran, setRan] = useState(false);
  const invalidLib = /import\s+\w+\s+from\s+['"](?!stdio|fs|http)/.test(code);

  return (
    <div>
      <PageHeader
        title="Editor máquina"
        subtitle={`Tarefa ${unit.title} · libs v1: stdio, fs, http · loops for/while`}
        actions={
          <Link className="btn ghost" to="/gantt">
            Voltar ao Gantt
          </Link>
        }
      />

      <div className="grid-2">
        <Panel title="Programa">
          <textarea className="code" rows={14} value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="row gap wrap" style={{ marginTop: '0.75rem' }}>
            <Badge tone="info">stdio</Badge>
            <Badge tone="info">fs</Badge>
            <Badge tone="info">http</Badge>
            <Badge>for</Badge>
            <Badge>while</Badge>
          </div>
          {invalidLib ? (
            <p className="danger-text">Biblioteca fora do conjunto v1 — salvar/executar rejeitado.</p>
          ) : (
            <p className="muted small">Programa dentro do conjunto permitido.</p>
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
            {unit.outputs?.map((o) => (
              <li key={o.ref}>
                out · <strong>{o.name}</strong> — <code>{o.ref}</code>
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
    </div>
  );
}
