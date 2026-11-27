import { NodePanel } from './features/NodePanel.tsx';
import { PairDialog } from './features/PairDialog.tsx';
import { Runs } from './features/Runs.tsx';
import { linkLabel } from './features/status.ts';
import { Tree } from './features/Tree.tsx';
import { Welcome } from './features/Welcome.tsx';
import { demoName } from './folder/handles.ts';
import { cancelRemove, closeFolder, confirmRemove, dismissError, openPairing, useApp } from './store/app.ts';
import { Dialog } from './ui/Dialog.tsx';

export function App() {
  const app = useApp();
  const selected = app.snapshot.activities.find((a) => a.id === app.selected);
  const removing = app.snapshot.activities.find((a) => a.id === app.removing?.id);

  return (
    <>
      {app.error && (
        <div className="toast" role="alert">
          {app.error}
          <button type="button" aria-label="Fechar aviso" onClick={dismissError}>✕</button>
        </div>
      )}
      {app.phase !== 'open' ? (
        <Welcome app={app} />
      ) : (
        <div className="shell">
          <header className="top">
            <span className="logo">Plans</span>
            <span className="project" title="Projeto">{app.folderName}{demoName !== null && ' · demonstração'}</span>
            {app.readOnly && <span className="badge">somente leitura</span>}
            <span className="spacer" />
            <button type="button" className={`link-chip ${app.link.state}`} onClick={() => void openPairing(true)}>
              <i aria-hidden="true" /> {linkLabel(app.link)}
            </button>
            <button type="button" className="btn ghost" onClick={() => void closeFolder()}>Trocar pasta</button>
          </header>
          {app.snapshot.problems.length > 0 && (
            <details className="problems">
              <summary>{app.snapshot.problems.length} arquivo(s) com problema (nada foi alterado)</summary>
              <ul>{app.snapshot.problems.map((p) => <li key={p.file}><code>{p.file}</code>: {p.message}</li>)}</ul>
            </details>
          )}
          <div className="body">
            <Tree app={app} />
            <aside className="side">
              {selected ? <NodePanel key={selected.id} app={app} node={selected} /> : <p className="muted pad">Selecione uma atividade para definir responsável e descrição.</p>}
              <Runs app={app} />
            </aside>
          </div>
        </div>
      )}
      {removing && app.removing && (
        <Dialog
          title="Remover com os filhos?"
          onClose={cancelRemove}
          actions={
            <>
              <button type="button" className="btn ghost" onClick={cancelRemove}>Cancelar</button>
              <button type="button" className="btn pri" onClick={() => void confirmRemove()}>Remover {app.removing.count + 1} atividades</button>
            </>
          }
        >
          <p>“{removing.title}” tem {app.removing.count} {app.removing.count === 1 ? 'atividade abaixo' : 'atividades abaixo'}. Os arquivos vão para <code>.plans/trash/</code>.</p>
        </Dialog>
      )}
      {app.pairingOpen && <PairDialog app={app} />}
    </>
  );
}
