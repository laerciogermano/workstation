/**
 * Insights (RF-33, RF-34, RN-14): cruzam adesão com tendência e só usam o que foi registrado.
 * Tom factual, sem diagnóstico.
 */
import type { Measurement } from './body';
import { type IsoDate, WEEKDAYS_PT, daysBetween, weekday } from './dates';
import { DAY_STATUS_LABEL, type DayStatus, type FoodId, foodOf } from './diet';
import { type Energy, expectedWeeklyRate } from './energy';
import { dfmt, sgn } from './format';
import { plannedSessionsPerWeek } from './training';

export const INSIGHT_TARGETS = [
  'progress',
  'diet-close',
  'diet-plan',
  'pantry',
  'body',
  'training',
  'measure',
] as const;
export type InsightTarget = (typeof INSIGHT_TARGETS)[number];

export interface Insight {
  icon: string;
  tag: string;
  title: string;
  text: string;
  target: InsightTarget;
}

export interface WeekDay {
  date: IsoDate;
  diet: DayStatus | null;
  proteinOk: boolean;
  trained: boolean;
}

export interface InsightInput {
  today: IsoDate;
  energy: Energy;
  history: readonly Measurement[];
  week: readonly WeekDay[];
  pantry: readonly FoodId[];
  streak: number;
}

const PROTEIN_QUICK: FoodId[] = ['ovo', 'iogurte', 'whey', 'queijo'];

export function insightsOf(i: InsightInput): Insight[] {
  const out: Insight[] = [];
  const h = i.history;
  const last = h[h.length - 1];

  if (h.length >= 2 && i.energy.strategy !== 'manutencao') {
    const a = h[Math.max(0, h.length - 3)];
    if (a && last && daysBetween(a.date, last.date) >= 7) {
      const wk = daysBetween(a.date, last.date) / 7;
      const rate = (last.weightKg - a.weightKg) / wk;
      const expected = expectedWeeklyRate(i.energy);
      const ratio = expected ? rate / expected : 0;
      const title =
        ratio > 0.7 && ratio < 1.3
          ? 'No ritmo da projeção'
          : ratio >= 1.3
            ? 'Mais rápido que o projetado'
            : 'Abaixo do ritmo projetado';
      out.push({
        icon: 'chart',
        tag: 'Ritmo',
        title,
        text: `Últimas ${Math.round(wk)} semanas: ${sgn(rate)} kg/semana. A projeção com 85% de adesão previa ${sgn(expected)} kg/semana.`,
        target: 'progress',
      });
    }
  }

  const closed = i.week.filter((d) => d.diet && d.diet !== 'vazio');
  if (closed.length) {
    const ok = closed.filter((d) => d.diet === 'cumpriu').length;
    const off = closed.filter((d) => d.diet !== 'cumpriu');
    out.push({
      icon: 'bowl',
      tag: 'Dieta',
      title: `${ok} de ${closed.length} dias na meta`,
      text: off.length
        ? `Fora da meta: ${off.map((d) => `${WEEKDAYS_PT[weekday(d.date)]?.toLowerCase()} (${DAY_STATUS_LABEL[d.diet ?? 'vazio'].toLowerCase()})`).join(', ')}.`
        : 'Todos os dias fechados ficaram na meta.',
      target: 'diet-close',
    });
    const lowP = closed.filter((d) => !d.proteinOk).length;
    if (lowP >= 2) {
      const sug = PROTEIN_QUICK.find((id) => i.pantry.includes(id));
      out.push({
        icon: 'egg',
        tag: 'Proteína',
        title: `Proteína abaixo em ${lowP} dos últimos ${closed.length} dias`,
        text: sug
          ? `Você tem ${foodOf(sug).name.toLowerCase()} no estoque: ele já entra no plano de hoje.`
          : 'Nenhuma fonte rápida de proteína no estoque. Vale incluir ovo ou iogurte.',
        target: sug ? 'diet-plan' : 'pantry',
      });
    }
  }

  const first = h[0];
  if (first && last && h.length >= 2) {
    out.push({
      icon: 'ruler',
      tag: 'Medidas',
      title: `${sgn(last.waistCm - first.waistCm)} cm de cintura desde ${dfmt(first.date)}`,
      text: `Peso ${sgn(last.weightKg - first.weightKg)} kg no mesmo período. Braço ${sgn(last.armCm - first.armCm)} cm.`,
      target: 'body',
    });
  }

  const trained = i.week.filter((d) => d.trained).length;
  out.push({
    icon: 'dumbbell',
    tag: 'Treino',
    title: `${trained} treino${trained === 1 ? '' : 's'} nos últimos 7 dias`,
    text: `Plano da semana: ${plannedSessionsPerWeek} sessões. Streak atual: ${i.streak} dia${i.streak === 1 ? '' : 's'} com ação registrada.`,
    target: 'training',
  });

  const since = last ? daysBetween(last.date, i.today) : null;
  if (since === null || since >= 7) {
    out.push({
      icon: 'clock',
      tag: 'Avaliação',
      title:
        since === null
          ? 'Registre sua primeira medida'
          : since >= 14
            ? 'Hora de medir de novo'
            : `Última medida há ${since} dias`,
      text: 'Medir a cada 14 dias, no mesmo horário e em jejum, deixa a tendência mais confiável.',
      target: 'measure',
    });
  }
  return out;
}
