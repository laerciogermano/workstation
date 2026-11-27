import { describeCommand, isOpenRun, tokenize } from '@plans/domain';
import { useEffect, useState } from 'react';
import type { RunView } from '../runs/runner.ts';
import { cancelRun, openPairing, runCommand, type State } from '../store/app.ts';
import { clientCommand } from './pairing.ts';

const LABEL: Record<RunView['record']['status'], string> = {
  waiting: 'aguardando aprovação no terminal', pending: 'enviado', running: 'executando', ok: 'concluído', failed: 'falhou',
  cancelled: 'cancelado', timeout: 'tempo esgotado', rejected: 'recusado', lost: 'perdido (o client reiniciou)',
};

function Run({ run }: { run: RunView }) {
  const { record } = run;
  const open = isOpenRun(record);
  const [copied, setCopied] = useState(false);
  const allow = record.allowCommand?.replace(/^plans-client/, clientCommand());
  return (
    <li className={`run ${record.status}`}>
      <div className="run-head">
        <code>{describeCommand(record)}</code>
        <span className="badge">{LABEL[record.status]}{record.code !== null && record.status === 'failed' ? ` (código ${record.code})` : ''}</span>
        {open && <button type="button" className="btn" onClick={() => cancelRun(record.runId)}>Cancelar</button>}
      </div>
      {record.status === 'rejected' && (
        <div className="note warn">
          {record.error}
          {allow ? (
            <>
              <p>Para liberar, rode no seu terminal e execute de novo:</p>
              <pre className="copy">{allow}</pre>
              <button type="button" className="btn" onClick={() => void navigator.clipboard.writeText(allow).then(() => setCopied(true))}>{copied ? 'Copiado' : 'Copiar'}</button>
            </>
          ) : (
            <p>Aprove pelo terminal com <code>{clientCommand()} run</code>.</p>
          )}
        </div>
      )}
      {record.status !== 'rejected' && record.error && <p className="note warn">{record.error}</p>}
      {run.output.some((c) => c.data) && (
        <pre className="output" tabIndex={0} aria-label="Saída do comando">
          {run.output.slice(-400).map((c, i) => <span key={i} className={c.stream}>{c.data.slice(-100_000)}</span>)}
        </pre>
      )}
      {record.truncated && <p className="muted small">Saída cortada em 5 MB.</p>}
      <p className="muted small">{new Date(record.startedAt).toLocaleString('pt-BR')} · runs/{record.runId}.json</p>
    </li>
  );
}

export function Runs({ app }: { app: State }) {
  const [line, setLine] = useState('');
  const [useShell, setUseShell] = useState(false);
  const [shell, setShell] = useState('');
  const [error, setError] = useState('');
  const ready = app.link.state === 'ready';
  const shells = app.link.state === 'ready' ? app.link.info.shells : [];
  useEffect(() => setError(''), [line, useShell]);
  const runs = app.runs.filter((r) => !app.selected || r.record.nodeId === app.selected);

  return (
    <section className="runs" aria-label="Comandos">
      <h3>Comandos {app.selected ? 'desta atividade' : 'do projeto'}</h3>
      {!ready && (
        <div className="note">
          {app.link.state === 'wrong-project' ? 'O client está pareado com outra pasta.' : 'Conecte o client para executar comandos.'}{' '}
          <button type="button" className="btn" onClick={() => void openPairing(true)}>Parear client</button>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            if (!line.trim()) return;
            if (useShell) void runCommand(app.selected, { script: line, shell: shell || shells[0] });
            else {
              const [program, ...args] = tokenize(line.trim());
              if (!program) return;
              void runCommand(app.selected, { program, args });
            }
            setLine('');
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <input aria-label="Comando" placeholder={useShell ? 'ls | wc -l' : 'git status'} value={line} onChange={(e) => setLine(e.target.value)} spellCheck={false} autoCapitalize="off" />
        <button type="submit" className="btn pri" disabled={!ready || !line.trim() || app.readOnly}>Executar</button>
        <label className="check">
          <input type="checkbox" checked={useShell} onChange={(e) => setUseShell(e.target.checked)} /> usar shell (pipes e variáveis)
        </label>
        {useShell && shells.length > 0 && (
          <select aria-label="Shell" value={shell || shells[0]} onChange={(e) => setShell(e.target.value)}>
            {shells.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
      </form>
      {error && <p className="note warn" role="alert">{error}</p>}
      {runs.length === 0 ? <p className="muted small">Nada executado ainda.</p> : <ul>{runs.map((r) => <Run key={r.record.runId} run={r} />)}</ul>}
    </section>
  );
}
