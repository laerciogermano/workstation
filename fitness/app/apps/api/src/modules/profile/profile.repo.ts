import type { Profile } from '@fitness/contracts';
import type { ActivityId, GoalId, MetabolicProfile, Sex } from '@fitness/domain';
import type { Queryable } from '../../shared/db';

interface Row {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: ActivityId;
  goal: GoalId;
  magnitude_pct: number;
  extreme_confirmed: boolean;
  updated_at: Date;
}

const COLS = 'sex, age, height_cm, weight_kg, activity, goal, magnitude_pct, extreme_confirmed, updated_at';

const toProfile = (r: Row): Profile => ({
  sex: r.sex,
  age: r.age,
  heightCm: r.height_cm,
  weightKg: r.weight_kg,
  activity: r.activity,
  goal: r.goal,
  magnitudePct: r.magnitude_pct,
  extremeConfirmed: r.extreme_confirmed,
  updatedAt: r.updated_at.toISOString(),
});

export async function findProfile(db: Queryable, deviceId: string): Promise<Profile | null> {
  const r = await db.query<Row>(`SELECT ${COLS} FROM profiles WHERE device_id = $1`, [deviceId]);
  return r.rows[0] ? toProfile(r.rows[0]) : null;
}

export async function upsertProfile(
  db: Queryable,
  deviceId: string,
  p: MetabolicProfile & { extremeConfirmed: boolean },
): Promise<Profile> {
  const r = await db.query<Row>(
    `INSERT INTO profiles (device_id, sex, age, height_cm, weight_kg, activity, goal, magnitude_pct, extreme_confirmed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (device_id) DO UPDATE SET
       sex = EXCLUDED.sex, age = EXCLUDED.age, height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg,
       activity = EXCLUDED.activity, goal = EXCLUDED.goal, magnitude_pct = EXCLUDED.magnitude_pct,
       extreme_confirmed = EXCLUDED.extreme_confirmed, updated_at = now()
     RETURNING ${COLS}`,
    [deviceId, p.sex, p.age, p.heightCm, p.weightKg, p.activity, p.goal, p.magnitudePct, p.extremeConfirmed],
  );
  const row = r.rows[0];
  if (!row) throw new Error('upsert de perfil sem retorno');
  return toProfile(row);
}

export async function updateWeight(db: Queryable, deviceId: string, weightKg: number): Promise<void> {
  await db.query(`UPDATE profiles SET weight_kg = $2, updated_at = now() WHERE device_id = $1`, [deviceId, weightKg]);
}
