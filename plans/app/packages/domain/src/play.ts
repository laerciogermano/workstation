// Play: pedir ao client que abra um terminal com a IA responsável trabalhando na atividade.
import type { Assignee } from './format.ts';

/** Programa reservado, atendido pelo próprio client (apps/client/internal/play). */
export const PLAY_PROGRAM = 'plans-play';

export const PLAY_AGENTS = { claude: 'Claude', gemini: 'Gemini' } as const;
export type PlayAgent = keyof typeof PLAY_AGENTS;

/**
 * Qual IA o responsável é: precisa ser do tipo `ai` e ter "claude" ou "gemini" como palavra no id ou no nome.
 * Devolve null para pessoas, máquinas, outras IAs e nomes que citam as duas.
 */
export function agentOf(assignee: Assignee | undefined): PlayAgent | null {
  if (assignee?.type !== 'ai') return null;
  const words = `${assignee.id} ${assignee.name}`.toLowerCase().split(/[^a-z]+/);
  const found = (Object.keys(PLAY_AGENTS) as PlayAgent[]).filter((a) => words.includes(a));
  return found.length === 1 ? found[0]! : null;
}

/** Só a IA e o id: título e descrição nunca vão no comando. */
export const playCommand = (agent: PlayAgent, activityId: string) => ({ program: PLAY_PROGRAM, args: [agent, activityId] });

/** Primeira versão do client que sabe atender o play; as anteriores procuram "plans-play" no PATH. */
export const PLAY_MIN_CLIENT = [0, 2] as const;

/** false só quando a versão é reconhecidamente antiga: uma versão fora do formato fica por conta do client. */
export function supportsPlay(version: string): boolean {
  const m = version.match(/^v?(\d+)\.(\d+)/);
  if (!m) return true;
  const [major, minor] = PLAY_MIN_CLIENT;
  return Number(m[1]) > major || (Number(m[1]) === major && Number(m[2]) >= minor);
}

/** O erro que um client antigo grava na execução: ele tentou rodar o play como um programa comum. */
export const isOldClientError = (run: { program?: string | undefined; error?: string | undefined }) =>
  run.program === PLAY_PROGRAM && !!run.error?.includes(`"${PLAY_PROGRAM}": executable file not found`);
