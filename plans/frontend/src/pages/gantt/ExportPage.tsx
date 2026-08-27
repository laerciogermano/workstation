import { useState } from 'react';
import { Link } from 'react-router-dom';
import { plans } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';

const sampleIr = `{
  "kind": "fop-ir",
  "plan": "plan-default",
  "nodes": [
    { "id": "u2", "fn": "definirOrcamento" },
    { "id": "u3", "fn": "compararModelos" }
  ],
  "edges": [{ "from": "u2.out", "to": "u3.in" }]
}`;

export function ExportPage() {
  const [dest, setDest] = useState<'ir' | 'ts' | 'py'>('ir');
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Exportar código"
        subtitle="Compilar FOP-IR e gerar TypeScript ou Python."
        actions={
          <Link className="btn ghost" to="/gantt">
            Voltar ao Gantt
          </Link>
        }
      />

      <div className="grid-2">
        <Panel title="Plano e consistência">
          <p>
            Plano: <strong>{plans[0].name}</strong>
          </p>
          <ul className="stack">
            <li>
              <Badge tone="ok">sem ciclo de estado</Badge>
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
          <p className="muted small">Destinos além de TypeScript e Python são rejeitados em v1.</p>
        </Panel>

        <Panel title="Pré-visualização">
          {preview ? <pre className="code-preview">{preview}</pre> : <p className="muted">Gere um artefato para visualizar.</p>}
        </Panel>
      </div>
    </div>
  );
}
