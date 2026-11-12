import type { ProgressResponse } from '@fitness/contracts';
import {
  type IsoDate,
  addDays,
  challengesOf,
  energyOf,
  insightsOf,
  lastDays,
  projection,
  streakOf,
} from '@fitness/domain';
import type { Db, Queryable } from '../../shared/db';
import { listMeasurements } from '../body/body.repo';
import { listClosedDays, listPantry } from '../diet/diet.repo';
import { requireProfile, toMetabolic } from '../profile/profile.service';
import { workoutDaysBetween } from '../training/training.repo';

/** Dias com ação real: treino concluído, dia de dieta fechado, medida registrada (RN-22). */
export async function actionDays(db: Queryable, deviceId: string): Promise<Set<IsoDate>> {
  const r = await db.query<{ day: IsoDate }>(
    `SELECT day FROM workout_days WHERE device_id = $1
     UNION SELECT day FROM diet_days WHERE device_id = $1
     UNION SELECT measured_on FROM measurements WHERE device_id = $1`,
    [deviceId],
  );
  return new Set(r.rows.map((x) => x.day));
}

export async function streakFor(db: Queryable, deviceId: string, today: IsoDate): Promise<number> {
  return streakOf(await actionDays(db, deviceId), today);
}

export async function getProgress(db: Db, deviceId: string, date: IsoDate): Promise<ProgressResponse> {
  const { profile, energy } = await requireProfile(db, deviceId);
  const from = addDays(date, -6);
  const [history, closed, workouts, pantry, streak] = await Promise.all([
    listMeasurements(db, deviceId),
    listClosedDays(db, deviceId, from, date),
    workoutDaysBetween(db, deviceId, from, date),
    listPantry(db, deviceId),
    streakFor(db, deviceId, date),
  ]);
  const closedBy = new Map(closed.map((c) => [c.day, c]));
  const trained = new Set(workouts);
  const week = lastDays(date, 7).map((d) => ({
    date: d,
    diet: closedBy.get(d)?.status ?? null,
    proteinOk: closedBy.get(d)?.protein_ok ?? false,
    trained: trained.has(d),
  }));
  const last = history[history.length - 1];
  return {
    date,
    energy,
    projection: projection(toMetabolic(profile)),
    history,
    insights: insightsOf({ today: date, energy: energyOf(toMetabolic(profile)), history, week, pantry, streak }),
    streak,
    challenges: challengesOf({
      today: date,
      workoutDays: trained,
      proteinOkDays: new Set(week.filter((d) => d.proteinOk).map((d) => d.date)),
      lastMeasurement: last?.date ?? null,
    }),
    week,
  };
}
