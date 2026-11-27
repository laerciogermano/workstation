import { useState } from 'react';
import { HUB_URL, newPairing, openPairing, setPairingPath, type State } from '../store/app.ts';
import { Dialog } from '../ui/Dialog.tsx';
import { clientCommand, pairCommand } from './pairing.ts';
import { linkLabel } from './status.ts';

function Copyable({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState('');
  return (
    <div className="copy-row">
      <pre className="copy" aria-label={label}>{text}</pre>
      <button type="button" className="btn" onClick={() => void navigator.clipboard.writeText(text).then(() => setCopied(text))}>{copied === text ? 'Copiado' : 'Copiar'}</button>
    </div>
  );
}

export function PairDialog({ app }: { app: State }) {
  if (!app.pairing) return null;
  return (
    <Dialog
      title="Parear o client"
      onClose={() => void openPairing(false)}
      actions={
        <>
          <button type="button" className="btn ghost" onClick={() => void newPairing()}>Gerar novo código</button>
          <button type="button" className="btn pri" onClick={() => void openPairing(false)}>Fechar</button>
        </>
      }
    >
      <p>O client executa na sua máquina os comandos que você liberar. O código abaixo é a chave: não compartilhe.</p>
      <label className="field">
        <span>Caminho desta pasta no computador (o navegador não informa)</span>
        <input value={app.pairing.path} placeholder="~/Documents/meu-projeto" onChange={(e) => void setPairingPath(e.target.value)} spellCheck={false} />
      </label>
      <p><strong>1.</strong> No terminal, pareie:</p>
      <Copyable label="Comando de pareamento" text={pairCommand(app.pairing.code, app.pairing.path, HUB_URL)} />
      <p><strong>2.</strong> Ligue o client e deixe o terminal aberto (ele pergunta antes de cada comando novo):</p>
      <Copyable label="Comando para ligar" text={`${clientCommand()} run`} />
      <p className={`link-state ${app.link.state}`} role="status">{linkLabel(app.link)}</p>
    </Dialog>
  );
}
