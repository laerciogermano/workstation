import {
  type DayStatus,
  type FoodId,
  type IsoDate,
  type MealId,
  type MealPrefs,
  type MealStatus,
  type PrefCategory,
  isFoodId,
} from '@fitness/domain';
import type { Queryable } from '../../shared/db';

export async function listPantry(db: Queryable, deviceId: string): Promise<FoodId[]> {
  const r = await db.query<{ food_id: string }>(
    `SELECT food_id FROM pantry_items WHERE device_id = $1 ORDER BY food_id`,
    [deviceId],
  );
  return r.rows.map((x) => x.food_id).filter(isFoodId);
}

export async function replacePantry(db: Queryable, deviceId: string, ids: readonly FoodId[]): Promise<void> {
  await db.query(`DELETE FROM pantry_items WHERE device_id = $1 AND NOT (food_id = ANY($2::text[]))`, [deviceId, ids]);
  await db.query(`INSERT INTO pantry_items (device_id, food_id) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING`, [
    deviceId,
    ids,
  ]);
}

export async function listPrefs(db: Queryable, deviceId: string): Promise<MealPrefs> {
  const r = await db.query<{ meal_id: MealId; category: PrefCategory; food_id: string }>(
    `SELECT meal_id, category, food_id FROM meal_prefs WHERE device_id = $1`,
    [deviceId],
  );
  const out: MealPrefs = {};
  for (const row of r.rows) {
    if (!isFoodId(row.food_id)) continue;
    out[row.meal_id] = { ...(out[row.meal_id] ?? {}), [row.category]: row.food_id };
  }
  return out;
}

export async function setPref(db: Queryable, deviceId: string, meal: MealId, cat: PrefCategory, food: FoodId | null) {
  if (!food) {
    await db.query(`DELETE FROM meal_prefs WHERE device_id = $1 AND meal_id = $2 AND category = $3`, [
      deviceId,
      meal,
      cat,
    ]);
    return;
  }
  await db.query(
    `INSERT INTO meal_prefs (device_id, meal_id, category, food_id) VALUES ($1,$2,$3,$4)
     ON CONFLICT (device_id, meal_id, category) DO UPDATE SET food_id = EXCLUDED.food_id`,
    [deviceId, meal, cat, food],
  );
}

export async function clearPrefs(db: Queryable, deviceId: string): Promise<void> {
  await db.query(`DELETE FROM meal_prefs WHERE device_id = $1`, [deviceId]);
}

export async function listMealLogs(db: Queryable, deviceId: string, day: IsoDate) {
  const r = await db.query<{ meal_id: MealId; status: MealStatus }>(
    `SELECT meal_id, status FROM meal_logs WHERE device_id = $1 AND day = $2`,
    [deviceId, day],
  );
  return Object.fromEntries(r.rows.map((x) => [x.meal_id, x.status])) as Partial<Record<MealId, MealStatus>>;
}

export async function setMealLog(
  db: Queryable,
  deviceId: string,
  day: IsoDate,
  meal: MealId,
  status: MealStatus | null,
) {
  if (!status) {
    await db.query(`DELETE FROM meal_logs WHERE device_id = $1 AND day = $2 AND meal_id = $3`, [deviceId, day, meal]);
    return;
  }
  await db.query(
    `INSERT INTO meal_logs (device_id, day, meal_id, status) VALUES ($1,$2,$3,$4)
     ON CONFLICT (device_id, day, meal_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
    [deviceId, day, meal, status],
  );
}

export interface ExtraRow {
  id: string;
  name: string;
  kcal: number;
  p: number;
  c: number;
  g: number;
}

export async function listExtras(db: Queryable, deviceId: string, day: IsoDate): Promise<ExtraRow[]> {
  const r = await db.query<ExtraRow>(
    `SELECT id, name, kcal, protein_g AS p, carbs_g AS c, fat_g AS g
       FROM extra_items WHERE device_id = $1 AND day = $2 ORDER BY created_at`,
    [deviceId, day],
  );
  return r.rows;
}

export async function addExtra(db: Queryable, deviceId: string, day: IsoDate, x: Omit<ExtraRow, 'id'>) {
  await db.query(
    `INSERT INTO extra_items (device_id, day, name, kcal, protein_g, carbs_g, fat_g) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [deviceId, day, x.name, x.kcal, x.p, x.c, x.g],
  );
}

export async function removeExtra(db: Queryable, deviceId: string, day: IsoDate, id: string): Promise<boolean> {
  const r = await db.query(`DELETE FROM extra_items WHERE id = $1 AND device_id = $2 AND day = $3`, [
    id,
    deviceId,
    day,
  ]);
  return (r.rowCount ?? 0) > 0;
}

export interface ClosedDay {
  day: IsoDate;
  status: Exclude<DayStatus, 'vazio'>;
  protein_ok: boolean;
  closed_at: Date;
}

export async function listClosedDays(
  db: Queryable,
  deviceId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<ClosedDay[]> {
  const r = await db.query<ClosedDay>(
    `SELECT day, status, protein_ok, closed_at FROM diet_days WHERE device_id = $1 AND day BETWEEN $2 AND $3 ORDER BY day`,
    [deviceId, from, to],
  );
  return r.rows;
}

export async function upsertClosedDay(
  db: Queryable,
  deviceId: string,
  d: {
    day: IsoDate;
    status: Exclude<DayStatus, 'vazio'>;
    target: number;
    kcal: number;
    protein: number;
    proteinOk: boolean;
  },
): Promise<{ previous: string | null }> {
  const prev = await db.query<{ status: string }>(`SELECT status FROM diet_days WHERE device_id = $1 AND day = $2`, [
    deviceId,
    d.day,
  ]);
  await db.query(
    `INSERT INTO diet_days (device_id, day, status, target_kcal, kcal, protein_g, protein_ok) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (device_id, day) DO UPDATE SET status = EXCLUDED.status, target_kcal = EXCLUDED.target_kcal,
       kcal = EXCLUDED.kcal, protein_g = EXCLUDED.protein_g, protein_ok = EXCLUDED.protein_ok, closed_at = now()`,
    [deviceId, d.day, d.status, d.target, Math.round(d.kcal * 10) / 10, Math.round(d.protein * 10) / 10, d.proteinOk],
  );
  return { previous: prev.rows[0]?.status ?? null };
}
