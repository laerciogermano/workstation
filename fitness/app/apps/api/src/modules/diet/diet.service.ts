import type { DietDayResponse } from '@fitness/contracts';
import {
  type DayStatus,
  type IsoDate,
  addDays,
  buildPlan,
  consumedOf,
  dayStatus,
  lastDays,
  n0,
  proteinOk,
} from '@fitness/domain';
import type { Db } from '../../shared/db';
import { unprocessable } from '../../shared/errors';
import { requireProfile } from '../profile/profile.service';
import { listClosedDays, listExtras, listMealLogs, listPantry, listPrefs, upsertClosedDay } from './diet.repo';

/** Dia alimentar completo: plano pelo estoque + marcações + extras + julgamento (RF-18..21). */
export async function getDietDay(db: Db, deviceId: string, date: IsoDate): Promise<DietDayResponse> {
  const { energy } = await requireProfile(db, deviceId);
  const [pantry, prefs, logs, extras, closed] = await Promise.all([
    listPantry(db, deviceId),
    listPrefs(db, deviceId),
    listMealLogs(db, deviceId, date),
    listExtras(db, deviceId, date),
    listClosedDays(db, deviceId, addDays(date, -6), date),
  ]);
  const plan = buildPlan(pantry, energy, prefs);
  const consumed = consumedOf(plan, logs, extras);
  const status = dayStatus(consumed.kcal, energy.target);
  const byDay = new Map(closed.map((c) => [c.day, c]));
  const week = lastDays(date, 7).map((d) => ({
    date: d,
    status:
      d === date ? (byDay.get(d)?.status ?? (status === 'vazio' ? null : status)) : (byDay.get(d)?.status ?? null),
  }));
  return {
    date,
    energy,
    pantry,
    prefs: prefs as DietDayResponse['prefs'],
    plan,
    logs: logs as DietDayResponse['logs'],
    extras,
    consumed,
    status,
    closedAt: byDay.get(date)?.closed_at.toISOString() ?? null,
    week,
  };
}

/** Fechar o dia (RF-21, RN-11, RN-22): grava o julgamento e alimenta streak/desafios. */
export async function closeDay(db: Db, deviceId: string, date: IsoDate) {
  const day = await getDietDay(db, deviceId, date);
  if (day.status === 'vazio')
    throw unprocessable('NOTHING_LOGGED', 'Marque ao menos uma refeição antes de fechar o dia');
  const status = day.status as Exclude<DayStatus, 'vazio'>;
  const pOk = proteinOk(day.consumed.p, day.energy.protein);
  const { previous } = await upsertClosedDay(db, deviceId, {
    day: date,
    status,
    target: day.energy.target,
    kcal: day.consumed.kcal,
    protein: day.consumed.p,
    proteinOk: pOk,
  });
  return {
    status,
    firstTimeCumpriu: status === 'cumpriu' && previous !== 'cumpriu',
    post: {
      kind: 'dieta' as const,
      title: 'Meta da dieta cumprida',
      values: [
        ['Meta', `${n0(day.energy.target)} kcal`],
        ['Proteína', `${n0(day.consumed.p)} g`],
      ] as [string, string][],
    },
  };
}
