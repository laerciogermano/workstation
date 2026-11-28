// Play: só aparece quando o responsável é uma IA suportada. Pede ao client um terminal com ela na atividade.
import { agentOf, isOldClientError, isOpenRun, PLAY_AGENTS, PLAY_PROGRAM, playCommand, supportsPlay, type Activity, type RunRecord } from '@plans/domain';
import { fail, openPairing, runCommand, type State } from '../store/app.ts';
import { Icon } from '../ui/Icon.tsx';
import { oldClientHelp } from './pairing.ts';

const FAILED: RunRecord['status'][] = ['failed', 'rejected', 'timeout', 'lost'];

type Props = {
  activity: Activity;
  app: State;
  tabIndex?: number;
  /** mostra o texto ao lado do ícone (cartão aberto) */
  wide?: boolean;
};

export function PlayButton({ activity, app, tabIndex, wide }: Props) {
  const agent = agentOf(app.snapshot.assignees.find((a) => a.id === activity.assignee));
  if (!agent) return null;
  const name = PLAY_AGENTS[agent];
  const ready = app.link.state === 'ready';
  const old = app.link.state === 'ready' && !supportsPlay(app.link.info.version);
  // as execuções vêm da mais nova para a mais antiga
  const last = app.runs.find((r) => r.record.nodeId === activity.id && r.record.program === PLAY_PROGRAM);
  const open = ready && !!last && isOpenRun(last.record);
  const failed = !!last && FAILED.includes(last.record.status);

  let state = '';
  let text = `Executar com ${name}`;
  let hint = `Abre um terminal no seu computador com o ${name} trabalhando nesta atividade`;
  if (!ready) hint = `Conecte o client para executar com o ${name}`;
  else if (old) {
    state = ' failed';
    text = 'Atualize o client para usar o play';
    hint = oldClientHelp();
  } else if (open) {
    state = ' waiting';
    text = last.record.status === 'waiting' ? 'Aprove no terminal do client' : 'Abrindo terminal…';
    hint = text;
  } else if (failed) {
    state = ' failed';
    const why = isOldClientError(last.record)
      ? 'o client era antigo'
      : last.record.error || last.output.map((c) => c.data).join('').trim() || 'veja a lista de comandos';
    hint = `O último play não abriu: ${why.slice(-300)}. Clique para tentar de novo`;
  }

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className={`play${wide ? ' wide' : ''}${state}`}
      disabled={app.readOnly || (open && !old)}
      aria-label={`${text}: ${activity.title}`}
      title={hint}
      onClick={(e) => {
        e.stopPropagation();
        if (!ready) void openPairing(true);
        // um client antigo procuraria "plans-play" no PATH: explica em vez de enviar
        else if (old) fail(new Error(oldClientHelp()));
        else void runCommand(activity.id, playCommand(agent, activity.id));
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Icon name="play" size={wide ? 14 : 11} />
      {wide && <span>{text}</span>}
    </button>
  );
}
