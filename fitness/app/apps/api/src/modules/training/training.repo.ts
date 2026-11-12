import { type ExerciseId, type ExerciseLog, type IsoDate, exerciseOf, isExerciseId } from '@fitness/domain';
import type { Queryable } from '../../shared/db';

export async function listLogs(db: Queryable, deviceId: string, day: IsoDate): Promise<ExerciseLog[]> {
  const r = await db.query<{ exercise_id: string; sets_done: number; load_kg: number }>(
    `SELECT exercise_id, sets_done, load_kg FROM workout_logs WHERE device_id = $1 AND day = $2`,
    [deviceId, day],
  );
  return r.rows
    .filter((x): x is typeof x & { exercise_id: ExerciseId } => isExerciseId(x.exercise_id))
    .map((x) => ({ exerciseId: x.exercise_id, setsDone: x.sets_done, loadKg: x.load_kg }));
}

export async function upsertLog(db: Queryable, deviceId: string, day: IsoDate, log: ExerciseLog): Promise<void> {
  await db.query(
    `INSERT INTO workout_logs (device_id, day, exercise_id, sets_done, load_kg) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (device_id, day, exercise_id) DO UPDATE SET sets_done = EXCLUDED.sets_done,
       load_kg = EXCLUDED.load_kg, updated_at = now()`,
    [deviceId, day, log.exerciseId, log.setsDone, log.loadKg],
  );
}

/** Melhor carga em sessões concluídas antes de `day`, só com todas as séries feitas. */
export async function bestLoadsBefore(
  db: Queryable,
  deviceId: string,
  day: IsoDate,
): Promise<Partial<Record<ExerciseId, number>>> {
  const r = await db.query<{ exercise_id: string; sets_done: number; load_kg: number }>(
    `SELECT wl.exercise_id, wl.sets_done, wl.load_kg
       FROM workout_logs wl
       JOIN workout_days wd ON wd.device_id = wl.device_id AND wd.day = wl.day
      WHERE wl.device_id = $1 AND wl.day < $2 AND wl.load_kg > 0`,
    [deviceId, day],
  );
  const out: Partial<Record<ExerciseId, number>> = {};
  for (const row of r.rows) {
    if (!isExerciseId(row.exercise_id)) continue;
    if (row.sets_done < exerciseOf(row.exercise_id).sets) continue;
    out[row.exercise_id] = Math.max(out[row.exercise_id] ?? 0, row.load_kg);
  }
  return out;
}

export async function findWorkoutDay(db: Queryable, deviceId: string, day: IsoDate) {
  const r = await db.query<{ completed_at: Date }>(
    `SELECT completed_at FROM workout_days WHERE device_id = $1 AND day = $2`,
    [deviceId, day],
  );
  return r.rows[0] ?? null;
}

export async function upsertWorkoutDay(
  db: Queryable,
  deviceId: string,
  d: { day: IsoDate; sessionId: string; kcal: number; minutes: number; volumeKg: number },
): Promise<void> {
  await db.query(
    `INSERT INTO workout_days (device_id, day, session_id, kcal, minutes, volume_kg) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (device_id, day) DO UPDATE SET session_id = EXCLUDED.session_id, kcal = EXCLUDED.kcal,
       minutes = EXCLUDED.minutes, volume_kg = EXCLUDED.volume_kg, completed_at = now()`,
    [deviceId, d.day, d.sessionId, d.kcal, d.minutes, d.volumeKg],
  );
}

export async function workoutDaysBetween(
  db: Queryable,
  deviceId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<IsoDate[]> {
  const r = await db.query<{ day: IsoDate }>(
    `SELECT day FROM workout_days WHERE device_id = $1 AND day BETWEEN $2 AND $3 ORDER BY day`,
    [deviceId, from, to],
  );
  return r.rows.map((x) => x.day);
}

export async function countWorkouts(db: Queryable, deviceId: string): Promise<number> {
  const r = await db.query<{ n: string }>(`SELECT count(*) AS n FROM workout_days WHERE device_id = $1`, [deviceId]);
  return Number(r.rows[0]?.n ?? 0);
}
