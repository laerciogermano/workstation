import { type FoodId, type InsightTarget, type PlanItem, addDays, dfmt, foodOf } from '@fitness/domain';
import { todayLocal } from './date';

export const addWeeksLabel = (weeks: number): string => dfmt(addDays(todayLocal(), weeks * 7));

/** "2 ovos" · "1 fatia" · "120 g" */
export function itemText(i: PlanItem): string {
  const f = foodOf(i.foodId as FoodId);
  if (f.unitG && f.unitLabel) {
    const n = i.grams / f.unitG;
    return `${n} ${f.unitLabel}${n > 1 ? 's' : ''}`;
  }
  return `${i.grams} g`;
}

export const INSIGHT_ROUTE: Record<InsightTarget, string> = {
  progress: '/progresso',
  'diet-close': '/dieta/fechar',
  'diet-plan': '/dieta',
  pantry: '/dieta/estoque',
  body: '/corpo',
  training: '/treino',
  measure: '/corpo/medir',
};
