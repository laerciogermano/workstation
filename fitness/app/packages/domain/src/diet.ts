/**
 * Dieta pelo estoque (RF-17..22, RN-10, RN-11). O plano usa só ingredientes disponíveis e
 * avisa quando não fecha a meta em vez de inventar alimento.
 */
import type { Energy } from './energy';

export const FOOD_CATEGORIES = ['prot', 'carb', 'fat', 'veg'] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
export const FOOD_CATEGORY_LABEL: Record<FoodCategory, string> = {
  prot: 'Proteínas',
  carb: 'Carboidratos',
  fat: 'Gorduras',
  veg: 'Vegetais',
};

export interface Food {
  readonly id: string;
  readonly name: string;
  readonly category: FoodCategory;
  /** por 100 g */
  readonly kcal: number;
  readonly p: number;
  readonly c: number;
  readonly g: number;
  /** gramas por unidade e rótulo (ovo, fatia…) */
  readonly unitG?: number;
  readonly unitLabel?: string;
}

export const FOODS = [
  { id: 'ovo', name: 'Ovo', category: 'prot', kcal: 143, p: 13, c: 1.1, g: 9.5, unitG: 50, unitLabel: 'ovo' },
  { id: 'frango', name: 'Peito de frango', category: 'prot', kcal: 165, p: 31, c: 0, g: 3.6 },
  { id: 'patinho', name: 'Patinho moído', category: 'prot', kcal: 219, p: 35.9, c: 0, g: 7.3 },
  { id: 'tilapia', name: 'Tilápia', category: 'prot', kcal: 128, p: 26, c: 0, g: 2.7 },
  { id: 'iogurte', name: 'Iogurte natural', category: 'prot', kcal: 51, p: 4.1, c: 1.9, g: 3 },
  { id: 'queijo', name: 'Queijo minas frescal', category: 'prot', kcal: 264, p: 17.4, c: 3.2, g: 20.2 },
  { id: 'whey', name: 'Whey protein', category: 'prot', kcal: 400, p: 80, c: 8, g: 6, unitG: 30, unitLabel: 'scoop' },
  { id: 'arroz', name: 'Arroz branco cozido', category: 'carb', kcal: 128, p: 2.5, c: 28.1, g: 0.2 },
  { id: 'feijao', name: 'Feijão carioca cozido', category: 'carb', kcal: 76, p: 4.8, c: 13.6, g: 0.5 },
  { id: 'batata', name: 'Batata-doce cozida', category: 'carb', kcal: 77, p: 0.6, c: 18.4, g: 0.1 },
  { id: 'aveia', name: 'Aveia em flocos', category: 'carb', kcal: 394, p: 13.9, c: 66.6, g: 8.5 },
  {
    id: 'pao',
    name: 'Pão integral',
    category: 'carb',
    kcal: 253,
    p: 9.4,
    c: 49.9,
    g: 3.7,
    unitG: 25,
    unitLabel: 'fatia',
  },
  { id: 'banana', name: 'Banana', category: 'carb', kcal: 98, p: 1.3, c: 26, g: 0.1, unitG: 70, unitLabel: 'banana' },
  { id: 'azeite', name: 'Azeite', category: 'fat', kcal: 884, p: 0, c: 0, g: 100 },
  { id: 'amendoim', name: 'Pasta de amendoim', category: 'fat', kcal: 588, p: 25, c: 20, g: 50 },
  { id: 'brocolis', name: 'Brócolis', category: 'veg', kcal: 25, p: 2.1, c: 4.4, g: 0.5 },
  { id: 'salada', name: 'Folhas e tomate', category: 'veg', kcal: 18, p: 1, c: 3.2, g: 0.2 },
] as const satisfies readonly Food[];

export type FoodId = (typeof FOODS)[number]['id'];
export const FOOD_IDS = FOODS.map((f) => f.id) as [FoodId, ...FoodId[]];

export function foodOf(id: FoodId): Food {
  const f = FOODS.find((x) => x.id === id);
  if (!f) throw new Error(`alimento desconhecido: ${id}`);
  return f;
}
export const isFoodId = (id: string): id is FoodId => FOODS.some((f) => f.id === id);

/** Estoque inicial sugerido no primeiro uso. */
export const DEFAULT_PANTRY: FoodId[] = [
  'ovo',
  'frango',
  'iogurte',
  'arroz',
  'feijao',
  'batata',
  'aveia',
  'banana',
  'azeite',
  'salada',
];

export const MEAL_IDS = ['cafe', 'almoco', 'lanche', 'jantar'] as const;
export type MealId = (typeof MEAL_IDS)[number];

interface MealTemplate {
  readonly id: MealId;
  readonly name: string;
  readonly time: string;
  readonly share: number;
  readonly prot: readonly FoodId[];
  readonly carb: readonly FoodId[];
  readonly fat: readonly FoodId[];
  readonly fatG: number;
  readonly veg: readonly FoodId[];
  readonly beans?: boolean;
}

export const MEALS: readonly MealTemplate[] = [
  {
    id: 'cafe',
    name: 'Café da manhã',
    time: '07:30',
    share: 0.25,
    prot: ['ovo', 'iogurte', 'queijo', 'whey'],
    carb: ['pao', 'aveia', 'banana'],
    fat: ['amendoim'],
    fatG: 10,
    veg: [],
  },
  {
    id: 'almoco',
    name: 'Almoço',
    time: '12:30',
    share: 0.35,
    prot: ['frango', 'patinho', 'tilapia', 'ovo'],
    carb: ['arroz', 'batata'],
    beans: true,
    fat: ['azeite'],
    fatG: 8,
    veg: ['salada', 'brocolis'],
  },
  {
    id: 'lanche',
    name: 'Lanche',
    time: '16:00',
    share: 0.15,
    prot: ['iogurte', 'whey', 'ovo', 'queijo'],
    carb: ['banana', 'aveia', 'pao'],
    fat: [],
    fatG: 0,
    veg: [],
  },
  {
    id: 'jantar',
    name: 'Jantar',
    time: '20:00',
    share: 0.25,
    prot: ['tilapia', 'frango', 'patinho', 'ovo'],
    carb: ['batata', 'arroz'],
    fat: ['azeite'],
    fatG: 6,
    veg: ['brocolis', 'salada'],
  },
];

export const PREF_CATEGORIES = ['prot', 'carb'] as const;
export type PrefCategory = (typeof PREF_CATEGORIES)[number];
export type MealPrefs = Partial<Record<MealId, Partial<Record<PrefCategory, FoodId>>>>;

export interface Nutrients {
  kcal: number;
  p: number;
  c: number;
  g: number;
}
export const ZERO: Nutrients = { kcal: 0, p: 0, c: 0, g: 0 };

export function nutrientsOf(f: Food, grams: number): Nutrients {
  return { kcal: (f.kcal * grams) / 100, p: (f.p * grams) / 100, c: (f.c * grams) / 100, g: (f.g * grams) / 100 };
}
export function sumNutrients(arr: readonly Nutrients[]): Nutrients {
  return arr.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, g: a.g + x.g }), ZERO);
}
export function scaleNutrients(n: Nutrients, f: number): Nutrients {
  return { kcal: n.kcal * f, p: n.p * f, c: n.c * f, g: n.g * f };
}

/** Teto por porção para não gerar "500 g de queijo". */
const CAP: Partial<Record<FoodId, number>> = {
  ovo: 150,
  iogurte: 200,
  queijo: 60,
  whey: 30,
  frango: 200,
  patinho: 180,
  tilapia: 200,
};

function roundGrams(f: Food, grams: number): number {
  if (f.unitG) return Math.max(1, Math.round(grams / f.unitG)) * f.unitG;
  return Math.max(0, Math.round(grams / 5) * 5);
}

export interface PlanItem {
  foodId: FoodId;
  grams: number;
}
export interface PlannedMeal {
  id: MealId;
  name: string;
  time: string;
  items: PlanItem[];
  total: Nutrients;
  targetKcal: number;
  /** alternativas do estoque para trocar fonte (só o que está disponível) */
  alternatives: Record<PrefCategory, FoodId[]>;
}
export interface DietPlan {
  meals: PlannedMeal[];
  total: Nutrients;
  missing: FoodCategory[];
  viable: boolean;
  coverage: { kcal: number; protein: number };
}

export function buildPlan(
  pantry: readonly FoodId[],
  e: Pick<Energy, 'target' | 'protein'>,
  prefs: MealPrefs = {},
): DietPlan {
  const has = (id: FoodId) => pantry.includes(id);
  const pick = (m: MealTemplate, cat: 'prot' | 'carb' | 'fat' | 'veg'): FoodId | undefined => {
    const pref = cat === 'prot' || cat === 'carb' ? prefs[m.id]?.[cat] : undefined;
    if (pref && has(pref) && m[cat].includes(pref)) return pref;
    return m[cat].find(has);
  };
  const missing = new Set<FoodCategory>();
  const meals: PlannedMeal[] = MEALS.map((m) => {
    const targetKcal = e.target * m.share;
    const targetP = e.protein * m.share * 0.9;
    const items: PlanItem[] = [];
    const pid = pick(m, 'prot');
    if (pid) {
      const f = foodOf(pid);
      const grams = roundGrams(f, Math.min((targetP * 100) / f.p, CAP[pid] ?? 999));
      items.push({ foodId: pid, grams });
      const rest = targetP - (f.p * grams) / 100;
      const p2 = rest > 8 ? m.prot.find((id) => id !== pid && has(id)) : undefined;
      if (p2) {
        const f2 = foodOf(p2);
        items.push({ foodId: p2, grams: roundGrams(f2, Math.min((rest * 100) / f2.p, CAP[p2] ?? 999)) });
      }
    } else missing.add('prot');
    const fid = pick(m, 'fat');
    if (fid && m.fatG) items.push({ foodId: fid, grams: m.fatG });
    const vid = pick(m, 'veg');
    if (vid) items.push({ foodId: vid, grams: 100 });
    const cid = pick(m, 'carb');
    if (cid) {
      const used = sumNutrients(items.map((i) => nutrientsOf(foodOf(i.foodId), i.grams))).kcal;
      let rem = Math.max(0, targetKcal - used);
      if (m.beans && has('feijao')) {
        const fb = foodOf('feijao');
        const gb = roundGrams(fb, (rem * 0.35 * 100) / fb.kcal);
        items.push({ foodId: 'feijao', grams: gb });
        rem -= nutrientsOf(fb, gb).kcal;
      }
      const fc = foodOf(cid);
      items.push({ foodId: cid, grams: roundGrams(fc, (Math.max(0, rem) * 100) / fc.kcal) });
    } else missing.add('carb');
    const total = sumNutrients(items.map((i) => nutrientsOf(foodOf(i.foodId), i.grams)));
    return {
      id: m.id,
      name: m.name,
      time: m.time,
      items,
      total,
      targetKcal: Math.round(targetKcal),
      alternatives: { prot: m.prot.filter(has), carb: m.carb.filter(has) },
    };
  });
  const total = sumNutrients(meals.map((m) => m.total));
  const coverage = { kcal: e.target ? total.kcal / e.target : 0, protein: e.protein ? total.p / e.protein : 0 };
  const viable = missing.size === 0 && coverage.kcal > 0.9 && coverage.kcal < 1.1 && coverage.protein > 0.85;
  return { meals, total, missing: [...missing], viable, coverage };
}

export const MEAL_STATUSES = ['feito', 'parcial', 'nao'] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];
export const MEAL_STATUS_LABEL: Record<MealStatus, string> = { feito: 'Comi', parcial: 'Metade', nao: 'Não comi' };

export function mealFactor(s: MealStatus | null | undefined): number {
  return s === 'feito' ? 1 : s === 'parcial' ? 0.5 : 0;
}

export interface ExtraItem extends Nutrients {
  name: string;
}

/** Consumido = refeições marcadas × fator + extras (RN-11). */
export function consumedOf(
  plan: DietPlan,
  logs: Partial<Record<MealId, MealStatus>>,
  extras: readonly Nutrients[],
): Nutrients {
  return sumNutrients([...plan.meals.map((m) => scaleNutrients(m.total, mealFactor(logs[m.id]))), ...extras]);
}

export const DAY_STATUSES = ['cumpriu', 'abaixo', 'estourou', 'vazio'] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];
export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  cumpriu: 'Cumpriu',
  abaixo: 'Abaixo',
  estourou: 'Estourou',
  vazio: 'Sem registro',
};

/** Cumpriu = 90%–105% da meta; abaixo ou estourou fora disso. */
export function dayStatus(consumed: number, target: number): DayStatus {
  if (!consumed) return 'vazio';
  const r = consumed / target;
  return r > 1.05 ? 'estourou' : r < 0.9 ? 'abaixo' : 'cumpriu';
}

/** Proteína do dia conta como "na meta" a partir de 90% do alvo. */
export const proteinOk = (p: number, target: number): boolean => p >= target * 0.9;

/** Atalhos de lanche fora do plano. */
export const QUICK_EXTRAS: readonly ExtraItem[] = [
  { name: 'Brigadeiro', kcal: 110, p: 1, c: 18, g: 4 },
  { name: 'Pão de queijo · 2 un', kcal: 150, p: 4, c: 20, g: 6 },
  { name: 'Cerveja · lata', kcal: 150, p: 1, c: 13, g: 0 },
  { name: 'Açaí · 300 ml', kcal: 330, p: 3, c: 55, g: 12 },
  { name: 'Whey · 1 scoop', kcal: 120, p: 24, c: 2, g: 2 },
];
