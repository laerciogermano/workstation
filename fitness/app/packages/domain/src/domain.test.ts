import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SHARE,
  type MetabolicProfile,
  SESSIONS,
  addDays,
  buildPlan,
  challengesOf,
  consumedOf,
  dayStatus,
  energyOf,
  exerciseKcal,
  exerciseOf,
  insightsOf,
  projection,
  sessionFor,
  streakOf,
  summarizeSession,
  tmbOf,
  toPublicStats,
  weekday,
} from './index';

const carla: MetabolicProfile = {
  sex: 'f',
  age: 31,
  heightCm: 168,
  weightKg: 72,
  activity: 'moderado',
  goal: 'definicao',
  magnitudePct: 20,
};

describe('energia', () => {
  it('RF-11 · TMB pela Mifflin–St Jeor', () => {
    expect(tmbOf(carla)).toBe(Math.round(10 * 72 + 6.25 * 168 - 5 * 31 - 161));
    expect(tmbOf({ ...carla, sex: 'm' })).toBe(tmbOf(carla) + 166);
  });

  it('RN-05 · perder gordura → déficit; RN-04 · ganhar músculo → superávit; RN-06 · manter → gasto', () => {
    const d = energyOf(carla);
    expect(d.strategy).toBe('deficit');
    expect(d.target).toBeLessThan(d.tdee);
    const h = energyOf({ ...carla, goal: 'hipertrofia', magnitudePct: 10 });
    expect(h.strategy).toBe('superavit');
    expect(h.target).toBeGreaterThan(h.tdee);
    const m = energyOf({ ...carla, goal: 'manutencao', magnitudePct: 0 });
    expect(m.strategy).toBe('manutencao');
    expect(Math.abs(m.target - m.tdee)).toBeLessThanOrEqual(5);
  });

  it('RF-15 · macros fecham a meta calórica', () => {
    const e = energyOf(carla);
    const kcal = e.protein * 4 + e.carbs * 4 + e.fat * 9;
    expect(Math.abs(kcal - e.target)).toBeLessThan(10);
    expect(e.protein).toBe(Math.round(2.2 * 72));
  });

  it('RN-16 · acima da faixa segura é extremo; magnitude respeita os limites do objetivo', () => {
    expect(energyOf({ ...carla, magnitudePct: 25 }).extreme).toBe(false);
    expect(energyOf({ ...carla, magnitudePct: 30 }).extreme).toBe(true);
    expect(energyOf({ ...carla, magnitudePct: 90 }).magnitudePct).toBe(30);
  });

  it('RF-16 · projeção de déficit desce e superávit sobe com teto semanal', () => {
    const p = projection(carla);
    expect(p).toHaveLength(13);
    expect(p[12]?.weightKg).toBeLessThan(72);
    const g = projection({ ...carla, goal: 'hipertrofia', magnitudePct: 20 });
    expect((g[1]?.weightKg ?? 0) - 72).toBeLessThanOrEqual(0.35);
  });
});

describe('dieta', () => {
  const e = energyOf(carla);
  it('RN-10 · plano usa só o estoque', () => {
    const pantry = ['ovo', 'frango', 'arroz', 'feijao', 'banana', 'azeite', 'pao', 'iogurte'] as const;
    const plan = buildPlan([...pantry], e);
    for (const m of plan.meals) for (const i of m.items) expect(pantry).toContain(i.foodId);
    expect(plan.viable).toBe(true);
  });

  it('RF-19 · estoque pobre não fecha e avisa o que falta', () => {
    const plan = buildPlan(['arroz', 'banana', 'azeite'], e);
    expect(plan.viable).toBe(false);
    expect(plan.missing).toContain('prot');
  });

  it('RF-21 · RN-11 · cumpriu entre 90% e 105% da meta', () => {
    expect(dayStatus(0, 2000)).toBe('vazio');
    expect(dayStatus(1700, 2000)).toBe('abaixo');
    expect(dayStatus(1900, 2000)).toBe('cumpriu');
    expect(dayStatus(2200, 2000)).toBe('estourou');
  });

  it('RF-20 · metade conta 50% e extras somam', () => {
    const plan = buildPlan(['ovo', 'pao', 'frango', 'arroz'], e);
    const cafe = plan.meals.find((m) => m.id === 'cafe');
    const c = consumedOf(plan, { cafe: 'parcial' }, [{ kcal: 100, p: 0, c: 0, g: 0 }]);
    expect(Math.round(c.kcal)).toBe(Math.round((cafe?.total.kcal ?? 0) * 0.5 + 100));
  });
});

describe('treino', () => {
  it('RF-27 · kcal por MET × peso × tempo e sessão soma só o feito', () => {
    const sq = exerciseOf('agachamento');
    expect(exerciseKcal(sq, 72)).toBeGreaterThan(0);
    const s = summarizeSession(SESSIONS.A, [{ exerciseId: 'agachamento', setsDone: 4, loadKg: 50 }], 72);
    expect(s.done).toEqual(['agachamento']);
    expect(s.kcal).toBe(exerciseKcal(sq, 72));
    expect(s.volumeKg).toBe(4 * 8 * 50);
  });

  it('RF-23 · sessão do dia segue o plano semanal', () => {
    expect(weekday('2026-11-08')).toBe(0);
    expect(sessionFor('2026-11-08').id).toBe('A');
    expect(sessionFor('2026-11-10').id).toBe('R');
  });
});

describe('gamificação', () => {
  it('RN-22 · streak conta dias seguidos com ação real', () => {
    const t = '2026-11-08';
    const days = new Set([t, addDays(t, -1), addDays(t, -2), addDays(t, -4)]);
    expect(streakOf(days, t)).toBe(3);
    expect(streakOf(new Set([addDays(t, -1)]), t)).toBe(1);
    expect(streakOf(new Set(), t)).toBe(0);
  });

  it('desafios semanais', () => {
    const t = '2026-11-08';
    const ch = challengesOf({
      today: t,
      workoutDays: new Set([t, addDays(t, -1)]),
      proteinOkDays: new Set(),
      lastMeasurement: addDays(t, -3),
    });
    expect(ch.find((c) => c.id === 'treinos5')?.progress).toBe(2);
    expect(ch.find((c) => c.id === 'medida14')?.done).toBe(true);
  });
});

describe('vitrine', () => {
  it('RN-18 · sensível não sai por padrão', () => {
    const pub = toPublicStats(
      { goal: 'definicao', streak: 5, workouts: 10, prs: ['Supino · 40 kg'], achievements: [], evolution: '−4 cm' },
      DEFAULT_SHARE,
    );
    expect(pub.evolution).toBeNull();
    expect(pub.prs).toHaveLength(1);
    const off = toPublicStats(
      { goal: 'definicao', streak: 5, workouts: 10, prs: [], achievements: [], evolution: null },
      { ...DEFAULT_SHARE, objetivo: false, streak: false },
    );
    expect(off.goal).toBeNull();
    expect(off.streak).toBeNull();
  });
});

describe('insights', () => {
  it('RN-14 · sem registro não inventa evolução', () => {
    const out = insightsOf({
      today: '2026-11-08',
      energy: energyOf(carla),
      history: [],
      week: [],
      pantry: [],
      streak: 0,
    });
    expect(out.some((i) => i.tag === 'Medidas' || i.tag === 'Ritmo' || i.tag === 'Dieta')).toBe(false);
    expect(out.some((i) => i.target === 'measure')).toBe(true);
  });
});
