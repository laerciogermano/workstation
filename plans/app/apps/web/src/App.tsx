import { Kanban } from './features/Kanban.tsx';
import { NodePanel } from './features/NodePanel.tsx';
import { PairDialog } from './features/PairDialog.tsx';
import { Runs } from './features/Runs.tsx';
import { SystemPrompt } from './features/SystemPrompt.tsx';
import { linkLabel } from './features/status.ts';
import { Tree } from './features/Tree.tsx';
import { Welcome } from './features/Welcome.tsx';
import { demoName } from './folder/handles.ts';
import { cancelRemove, chooseView, closeFolder, confirmRemove, dismissError, openPairing, togglePanel, useApp } from './store/app.ts';
import { Dialog } from './ui/Dialog.tsx';
import { Icon } from './ui/Icon.tsx';
import { ThemePicker } from './ui/ThemePicker.tsx';

const VIEWS = [['tree', 'Árvore'], ['kanban', 'Kanban']] as const;

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
            <div className="md-tabs" role="radiogroup" aria-label="Visão">
              {VIEWS.map(([view, label]) => (
                <button key={view} type="button" role="radio" aria-checked={app.view === view} onClick={() => chooseView(view)}>{label}</button>
              ))}
            </div>
            <span className="spacer" />
            <ThemePicker current={app.theme} />
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
          <div className={`body${app.panel ? '' : ' no-side'}`}>
            {app.view === 'kanban' ? <Kanban app={app} /> : <Tree app={app} />}
            <button
              type="button"
              className="panel-toggle"
              aria-label={app.panel ? 'Minimizar painel' : 'Mostrar painel'}
              title={app.panel ? 'Minimizar painel' : 'Mostrar painel'}
              aria-expanded={app.panel}
              aria-controls="side-panel"
              onClick={togglePanel}
            >
              <Icon name={app.panel ? 'panelClose' : 'panelOpen'} size={18} />
            </button>
            {/* escondido, não desmontado: um texto em edição não se perde */}
            <aside id="side-panel" className="side" hidden={!app.panel}>
              {selected ? <NodePanel key={selected.id} app={app} node={selected} /> : <p className="muted pad">Selecione uma atividade para definir responsável e descrição.</p>}
              {/* um só, fora do painel da atividade: o texto em edição continua ao trocar de seleção */}
              <SystemPrompt app={app} />
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
