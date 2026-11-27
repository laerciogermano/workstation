import { chooseFolder, closeFolder, confirmInit, reopen, type State } from '../store/app.ts';

export function Welcome({ app }: { app: State }) {
  if (app.phase === 'loading') return <main className="welcome" aria-busy="true">Abrindo…</main>;
  return (
    <main className="welcome">
      <h1>Plans</h1>
      {app.phase === 'unsupported' && (
        <>
          <p>Este navegador não consegue abrir uma pasta local.</p>
          <p className="muted">
            Use o Chrome ou o Edge no computador. Para só experimentar, abra a <a href="?demo">demonstração no navegador</a>.
          </p>
        </>
      )}
      {app.phase === 'welcome' && (
        <>
          <p>Escolha a pasta do projeto. Tudo é gravado em arquivos dentro dela.</p>
          <button type="button" className="btn pri" onClick={() => void chooseFolder()}>Abrir pasta</button>
          <p className="muted">
            Ou <a href="?demo">experimente sem pasta</a>: os arquivos ficam só neste navegador.
          </p>
        </>
      )}
      {app.phase === 'permission' && (
        <>
          <p>O navegador precisa da sua permissão para reabrir <strong>{app.folderName}</strong>.</p>
          <button type="button" className="btn pri" onClick={() => void reopen()}>Permitir e abrir</button>
          <button type="button" className="btn ghost" onClick={() => void closeFolder()}>Escolher outra pasta</button>
        </>
      )}
      {app.phase === 'confirm-init' && (
        <>
          <p><strong>{app.folderName}</strong> ainda não é um projeto do Plans.</p>
          <p className="muted">
            Serão criados <code>.plans/</code>, <code>activities/</code>, <code>runs/</code> e <code>assignees.json</code>.
            {!app.folderEmpty && ' A pasta já tem arquivos; eles não serão alterados.'}
          </p>
          <button type="button" className="btn pri" onClick={() => void confirmInit()}>Criar projeto aqui</button>
          <button type="button" className="btn ghost" onClick={() => void closeFolder()}>Cancelar</button>
        </>
      )}
    </main>
  );
}
