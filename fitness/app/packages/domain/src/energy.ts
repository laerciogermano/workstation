/**
 * Energia: TMB (Mifflin–St Jeor, RF-11), gasto diário (RF-12), objetivo → estratégia (RN-04..06),
 * faixas seguras (RN-16), macros (RF-15) e projeção com premissas visíveis (RF-16, RN-09).
 */

export const SEXES = ['f', 'm'] as const;
export type Sex = (typeof SEXES)[number];

export const ACTIVITY_IDS = ['sedentario', 'leve', 'moderado', 'alto', 'atleta'] as const;
export type ActivityId = (typeof ACTIVITY_IDS)[number];

export interface Activity {
  readonly id: ActivityId;
  readonly name: string;
  readonly desc: string;
  readonly factor: number;
}

export const ACTIVITIES: readonly Activity[] = [
  { id: 'sedentario', name: 'Sedentário', desc: 'Trabalho sentado, quase sem exercício', factor: 1.2 },
  { id: 'leve', name: 'Leve', desc: 'Caminhadas ou treino 1–2× por semana', factor: 1.375 },
  { id: 'moderado', name: 'Moderado', desc: 'Treino 3–5× por semana', factor: 1.55 },
  { id: 'alto', name: 'Alto', desc: 'Treino pesado 6–7× por semana', factor: 1.725 },
  { id: 'atleta', name: 'Muito alto', desc: 'Dois treinos por dia ou trabalho físico', factor: 1.9 },
];

export const STRATEGIES = ['deficit', 'superavit', 'manutencao'] as const;
export type Strategy = (typeof STRATEGIES)[number];
export const STRATEGY_LABEL: Record<Strategy, string> = {
  deficit: 'Déficit',
  superavit: 'Superávit',
  manutencao: 'Manutenção',
};

export const GOAL_IDS = ['hipertrofia', 'definicao', 'recomp', 'manutencao'] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface Goal {
  readonly id: GoalId;
  readonly name: string;
  readonly sub: string;
  readonly strategy: Strategy;
  /** magnitude padrão, mínima, máxima e limite seguro (% do gasto) */
  readonly defaultPct: number;
  readonly minPct: number;
  readonly maxPct: number;
  readonly safePct: number;
  /** proteína em g/kg */
  readonly proteinPerKg: number;
  readonly icon: string;
}

export const GOALS: readonly Goal[] = [
  {
    id: 'hipertrofia',
    name: 'Ganhar músculo',
    sub: 'hipertrofia',
    strategy: 'superavit',
    defaultPct: 10,
    minPct: 5,
    maxPct: 20,
    safePct: 15,
    proteinPerKg: 2.0,
    icon: 'dumbbell',
  },
  {
    id: 'definicao',
    name: 'Perder gordura',
    sub: 'definição',
    strategy: 'deficit',
    defaultPct: 20,
    minPct: 10,
    maxPct: 30,
    safePct: 25,
    proteinPerKg: 2.2,
    icon: 'flame',
  },
  {
    id: 'recomp',
    name: 'Recomposição',
    sub: 'trocar gordura por músculo',
    strategy: 'deficit',
    defaultPct: 10,
    minPct: 5,
    maxPct: 15,
    safePct: 15,
    proteinPerKg: 2.2,
    icon: 'refresh',
  },
  {
    id: 'manutencao',
    name: 'Manter',
    sub: 'saúde e constância',
    strategy: 'manutencao',
    defaultPct: 0,
    minPct: 0,
    maxPct: 0,
    safePct: 0,
    proteinPerKg: 1.6,
    icon: 'scale',
  },
];

/** Limites de entrada do perfil (validação de borda e steppers da UI). */
export const PROFILE_LIMITS = {
  age: [14, 90],
  heightCm: [130, 220],
  weightKg: [35, 250],
} as const;

export function goalOf(id: GoalId): Goal {
  const g = GOALS.find((x) => x.id === id);
  if (!g) throw new Error(`objetivo desconhecido: ${id}`);
  return g;
}

export function activityOf(id: ActivityId): Activity {
  const a = ACTIVITIES.find((x) => x.id === id);
  if (!a) throw new Error(`atividade desconhecida: ${id}`);
  return a;
}

export interface MetabolicProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityId;
  goal: GoalId;
  /** tamanho do déficit/superávit em % do gasto */
  magnitudePct: number;
}

export interface Energy {
  tmb: number;
  tdee: number;
  target: number;
  strategy: Strategy;
  magnitudePct: number;
  /** diferença meta − gasto (kcal) */
  diff: number;
  protein: number;
  carbs: number;
  fat: number;
  /** fora da faixa segura ou meta abaixo da TMB → exige confirmação (RN-16) */
  extreme: boolean;
}

/** Mifflin–St Jeor: 10·peso + 6,25·altura − 5·idade + (5 | −161) */
export function tmbOf(p: Pick<MetabolicProfile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  return Math.round(10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161));
}

export function tdeeOf(p: MetabolicProfile): number {
  return Math.round(tmbOf(p) * activityOf(p.activity).factor);
}

/** Restringe a magnitude ao intervalo permitido pelo objetivo. */
export function clampMagnitude(goal: GoalId, pct: number): number {
  const g = goalOf(goal);
  if (g.strategy === 'manutencao') return 0;
  return Math.min(g.maxPct, Math.max(g.minPct, Math.round(pct)));
}

export function energyOf(p: MetabolicProfile): Energy {
  const g = goalOf(p.goal);
  const tmb = tmbOf(p);
  const tdee = tdeeOf(p);
  const mag = clampMagnitude(p.goal, p.magnitudePct);
  const sign = g.strategy === 'deficit' ? -1 : g.strategy === 'superavit' ? 1 : 0;
  const target = Math.round((tdee * (1 + (sign * mag) / 100)) / 10) * 10;
  const protein = Math.round(g.proteinPerKg * p.weightKg);
  const fat = Math.round((g.strategy === 'superavit' ? 1 : 0.9) * p.weightKg);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const extreme = mag > g.safePct || target < tmb;
  return {
    tmb,
    tdee,
    target,
    strategy: g.strategy,
    magnitudePct: mag,
    diff: target - tdee,
    protein,
    carbs,
    fat,
    extreme,
  };
}

export const PROJECTION_ADHERENCE = 0.85;
export const KCAL_PER_KG = 7700;
export const MAX_GAIN_PER_WEEK = 0.35;

export interface ProjectionPoint {
  week: number;
  weightKg: number;
}

/** Projeção semanal recalculando o gasto com o peso novo a cada semana. */
export function projection(p: MetabolicProfile, weeks = 12, adherence = PROJECTION_ADHERENCE): ProjectionPoint[] {
  const strategy = goalOf(p.goal).strategy;
  const out: ProjectionPoint[] = [{ week: 0, weightKg: p.weightKg }];
  let kg = p.weightKg;
  for (let w = 1; w <= weeks; w++) {
    const e = energyOf({ ...p, weightKg: kg });
    let dKg = (e.diff * 7 * adherence) / KCAL_PER_KG;
    if (strategy === 'superavit') dKg = Math.min(dKg, MAX_GAIN_PER_WEEK);
    if (strategy === 'manutencao') dKg = 0;
    kg = Math.round((kg + dKg) * 100) / 100;
    out.push({ week: w, weightKg: kg });
  }
  return out;
}

/** Ritmo semanal previsto pela estratégia (kg/semana). */
export function expectedWeeklyRate(e: Energy, adherence = PROJECTION_ADHERENCE): number {
  if (e.strategy === 'manutencao') return 0;
  return (e.diff * 7 * adherence) / KCAL_PER_KG;
}
