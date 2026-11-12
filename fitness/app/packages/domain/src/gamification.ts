/**
 * Gamificação só com ações reais (RF-40, RN-22): treino concluído, dia de dieta fechado, medida registrada.
 */
import { type IsoDate, addDays, daysBetween, lastDays } from './dates';

/** Dias consecutivos com ação. Se hoje ainda não tem ação, conta a partir de ontem. */
export function streakOf(actionDays: ReadonlySet<IsoDate>, today: IsoDate): number {
  let d = actionDays.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (actionDays.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export const CHALLENGE_IDS = ['treinos5', 'proteina7', 'medida14'] as const;
export type ChallengeId = (typeof CHALLENGE_IDS)[number];

export interface Challenge {
  id: ChallengeId;
  name: string;
  icon: string;
  goal: number;
  progress: number;
  done: boolean;
}

export interface ChallengeInput {
  today: IsoDate;
  workoutDays: ReadonlySet<IsoDate>;
  proteinOkDays: ReadonlySet<IsoDate>;
  lastMeasurement: IsoDate | null;
}

export function challengesOf(i: ChallengeInput): Challenge[] {
  const week = lastDays(i.today, 7);
  const trained = week.filter((d) => i.workoutDays.has(d)).length;
  const prot = week.filter((d) => i.proteinOkDays.has(d)).length;
  const measured = i.lastMeasurement && daysBetween(i.lastMeasurement, i.today) <= 14 ? 1 : 0;
  const mk = (id: ChallengeId, name: string, icon: string, goal: number, p: number): Challenge => ({
    id,
    name,
    icon,
    goal,
    progress: Math.min(goal, p),
    done: p >= goal,
  });
  return [
    mk('treinos5', '5 treinos na semana', 'dumbbell', 5, trained),
    mk('proteina7', 'Proteína na meta 7 dias', 'egg', 7, prot),
    mk('medida14', 'Medida a cada 14 dias', 'ruler', 1, measured),
  ];
}

export interface AchievementInput {
  workouts: number;
  streak: number;
  proteinWeek: number;
  measurements: number;
}

export function achievementsOf(i: AchievementInput): string[] {
  const out: string[] = [];
  if (i.workouts >= 200) out.push('200 treinos');
  else if (i.workouts >= 100) out.push('100 treinos');
  else if (i.workouts >= 1) out.push('Primeiro treino');
  if (i.streak >= 21) out.push('3 semanas seguidas');
  else if (i.streak >= 7) out.push(`${i.streak} dias seguidos`);
  if (i.proteinWeek >= 7) out.push('Proteína 7/7');
  if (i.measurements >= 6) out.push(`Medida a cada 14 dias × ${i.measurements}`);
  return out;
}
