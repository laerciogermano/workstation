/**
 * Treino (RF-23..28, RN-12): musculação e calistenia no mesmo modelo; kcal por MET × peso × tempo.
 */
import { type IsoDate, weekday } from './dates';

export const MODALITIES = ['musc', 'cali'] as const;
export type Modality = (typeof MODALITIES)[number];

export const ANIMATIONS = ['squat', 'bench', 'row', 'press', 'plank', 'pushup', 'pullup'] as const;
export type Animation = (typeof ANIMATIONS)[number];

export interface Exercise {
  readonly id: string;
  readonly name: string;
  readonly modality: Modality;
  readonly anim: Animation;
  readonly muscles: string;
  readonly met: number;
  readonly sets: number;
  readonly reps?: number;
  readonly seconds?: number;
  /** carga padrão (kg); 0 = peso do corpo */
  readonly loadKg: number;
  /** sem barra na animação */
  readonly noBar?: boolean;
  readonly description: string;
  readonly tips: readonly string[];
}

export const EXERCISES = [
  {
    id: 'agachamento',
    name: 'Agachamento livre com barra',
    modality: 'musc',
    anim: 'squat',
    muscles: 'Quadríceps · glúteos · core',
    met: 6,
    sets: 4,
    reps: 8,
    loadKg: 50,
    description:
      'Barra apoiada no trapézio, desça como se fosse sentar até a coxa ficar paralela ao chão e suba empurrando o chão.',
    tips: ['Joelhos acompanham a ponta dos pés', 'Calcanhar sempre no chão', 'Peito aberto, olhar à frente'],
  },
  {
    id: 'supino',
    name: 'Supino reto com barra',
    modality: 'musc',
    anim: 'bench',
    muscles: 'Peito · tríceps · ombro anterior',
    met: 6,
    sets: 4,
    reps: 8,
    loadKg: 40,
    description:
      'Deitado no banco, desça a barra controlando até tocar o meio do peito e empurre até estender os cotovelos.',
    tips: [
      'Escápulas encaixadas e pés firmes no chão',
      'Cotovelos a ~45° do tronco, não abertos a 90°',
      'Desça em 2 s, suba em 1 s',
    ],
  },
  {
    id: 'remada',
    name: 'Remada curvada',
    modality: 'musc',
    anim: 'row',
    muscles: 'Costas · bíceps · posterior de ombro',
    met: 6,
    sets: 4,
    reps: 10,
    loadKg: 30,
    description: 'Tronco inclinado a ~45°, coluna neutra; puxe a barra até o umbigo levando os cotovelos para trás.',
    tips: ['Joelhos levemente flexionados', 'Sem balançar o tronco para ganhar impulso', 'Aperte as escápulas no topo'],
  },
  {
    id: 'desenvolvimento',
    name: 'Desenvolvimento com halteres',
    modality: 'musc',
    anim: 'press',
    muscles: 'Ombros · tríceps',
    met: 5,
    sets: 3,
    reps: 10,
    loadKg: 12,
    description: 'Em pé ou sentado, empurre os halteres da altura dos ombros até acima da cabeça sem arquear a lombar.',
    tips: ['Abdômen contraído', 'Não bata os halteres no topo', 'Desça até a linha do queixo'],
  },
  {
    id: 'prancha',
    name: 'Prancha',
    modality: 'cali',
    anim: 'plank',
    muscles: 'Core · ombros',
    met: 3.8,
    sets: 3,
    seconds: 40,
    loadKg: 0,
    noBar: true,
    description: 'Apoio nos antebraços e pontas dos pés, corpo em linha reta da cabeça aos calcanhares.',
    tips: ['Quadril nem alto nem caído', 'Respire curto e contínuo', 'Contraia glúteos'],
  },
  {
    id: 'barra',
    name: 'Barra fixa',
    modality: 'cali',
    anim: 'pullup',
    muscles: 'Dorsais · bíceps · antebraço',
    met: 8,
    sets: 4,
    reps: 6,
    loadKg: 0,
    description:
      'Pegada pronada um pouco mais larga que os ombros; puxe até o queixo passar a barra e desça até estender os braços.',
    tips: ['Comece com escápulas deprimidas', 'Sem chutar as pernas', 'Desça em 2 s'],
  },
  {
    id: 'flexao',
    name: 'Flexão de braço',
    modality: 'cali',
    anim: 'pushup',
    muscles: 'Peito · tríceps · core',
    met: 8,
    sets: 4,
    reps: 12,
    loadKg: 0,
    noBar: true,
    description: 'Mãos na linha dos ombros, corpo em prancha; desça até o peito quase tocar o chão e empurre.',
    tips: ['Cotovelos a ~45°', 'Quadril alinhado com o tronco', 'Amplitude completa'],
  },
  {
    id: 'agachar',
    name: 'Agachamento livre',
    modality: 'cali',
    anim: 'squat',
    muscles: 'Quadríceps · glúteos',
    met: 5,
    sets: 4,
    reps: 15,
    loadKg: 0,
    noBar: true,
    description: 'Pés na largura dos ombros, desça até a coxa paralela e suba sem tirar o calcanhar do chão.',
    tips: ['Braços à frente para equilibrar', 'Joelhos para fora', 'Ritmo constante'],
  },
] as const satisfies readonly Exercise[];

export type ExerciseId = (typeof EXERCISES)[number]['id'];
export const EXERCISE_IDS = EXERCISES.map((x) => x.id) as [ExerciseId, ...ExerciseId[]];
export const isExerciseId = (id: string): id is ExerciseId => EXERCISES.some((x) => x.id === id);

export function exerciseOf(id: ExerciseId): Exercise {
  const x = EXERCISES.find((e) => e.id === id);
  if (!x) throw new Error(`exercício desconhecido: ${id}`);
  return x;
}

export const SESSION_IDS = ['A', 'B', 'R'] as const;
export type SessionId = (typeof SESSION_IDS)[number];
export interface SessionTemplate {
  readonly id: SessionId;
  readonly name: string;
  readonly modality: string;
  readonly exercises: readonly ExerciseId[];
}
export const SESSIONS: Record<SessionId, SessionTemplate> = {
  A: {
    id: 'A',
    name: 'Treino A',
    modality: 'Musculação',
    exercises: ['agachamento', 'supino', 'remada', 'desenvolvimento', 'prancha'],
  },
  B: { id: 'B', name: 'Treino B', modality: 'Calistenia', exercises: ['barra', 'flexao', 'agachar', 'prancha'] },
  R: { id: 'R', name: 'Descanso ativo', modality: 'Descanso', exercises: [] },
};
/** Plano semanal padrão, indexado por dia da semana (Dom..Sáb). */
export const WEEK_PLAN: readonly SessionId[] = ['A', 'B', 'R', 'A', 'B', 'R', 'B'];
export const sessionFor = (d: IsoDate): SessionTemplate => SESSIONS[WEEK_PLAN[weekday(d)] ?? 'R'];
export const plannedSessionsPerWeek = WEEK_PLAN.filter((s) => s !== 'R').length;

export function exerciseMinutes(x: Pick<Exercise, 'sets' | 'reps' | 'seconds'>): number {
  return x.seconds ? (x.sets * (x.seconds + 60)) / 60 : (x.sets * ((x.reps ?? 0) * 3 + 90)) / 60;
}
export function exerciseKcal(
  x: Pick<Exercise, 'met' | 'sets' | 'reps' | 'seconds'>,
  bodyKg: number,
  setsDone?: number,
): number {
  const frac = setsDone === undefined ? 1 : Math.min(1, setsDone / x.sets);
  return Math.round(((x.met * bodyKg * exerciseMinutes(x)) / 60) * frac);
}
export function exerciseVolume(x: Pick<Exercise, 'sets' | 'reps'>, loadKg: number, setsDone = x.sets): number {
  return loadKg && x.reps ? setsDone * x.reps * loadKg : 0;
}
export function setsLabel(x: Pick<Exercise, 'sets' | 'reps' | 'seconds'>, loadKg: number): string {
  const unit = x.seconds ? `${x.seconds} s` : String(x.reps);
  const load = loadKg ? ` · ${loadKg} kg` : x.seconds ? '' : ' · peso do corpo';
  return `${x.sets} × ${unit}${load}`;
}

export interface ExerciseLog {
  exerciseId: ExerciseId;
  setsDone: number;
  loadKg: number;
}

export interface SessionSummary {
  sessionId: SessionId;
  done: ExerciseId[];
  kcal: number;
  minutes: number;
  volumeKg: number;
  plannedKcal: number;
  plannedMinutes: number;
}

/** Resumo real da sessão: só exercícios com todas as séries marcadas contam como feitos (RN-12). */
export function summarizeSession(
  session: SessionTemplate,
  logs: readonly ExerciseLog[],
  bodyKg: number,
): SessionSummary {
  const byId = new Map(logs.map((l) => [l.exerciseId, l]));
  let kcal = 0;
  let minutes = 0;
  let volumeKg = 0;
  const done: ExerciseId[] = [];
  for (const id of session.exercises) {
    const x = exerciseOf(id);
    const l = byId.get(id);
    if (!l || l.setsDone <= 0) continue;
    const sd = Math.min(l.setsDone, x.sets);
    if (sd >= x.sets) done.push(id);
    kcal += exerciseKcal(x, bodyKg, sd);
    minutes += exerciseMinutes(x) * (sd / x.sets);
    volumeKg += exerciseVolume(x, l.loadKg, sd);
  }
  const plannedKcal = session.exercises.reduce((a, id) => a + exerciseKcal(exerciseOf(id), bodyKg), 0);
  const plannedMinutes = session.exercises.reduce((a, id) => a + exerciseMinutes(exerciseOf(id)), 0);
  return {
    sessionId: session.id,
    done,
    kcal: Math.round(kcal),
    minutes: Math.round(minutes),
    volumeKg: Math.round(volumeKg),
    plannedKcal,
    plannedMinutes: Math.round(plannedMinutes),
  };
}

/** kcal de 30 min de caminhada leve (MET 3,5) para o dia de descanso. */
export const restWalkKcal = (bodyKg: number): number => Math.round(3.5 * bodyKg * 0.5);
