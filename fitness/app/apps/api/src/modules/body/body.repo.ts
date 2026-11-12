import type { IsoDate, Measurement } from '@fitness/domain';
import type { Queryable } from '../../shared/db';

const COLS = `measured_on AS "date", weight_kg AS "weightKg", waist_cm AS "waistCm", hip_cm AS "hipCm",
  chest_cm AS "chestCm", arm_cm AS "armCm", thigh_cm AS "thighCm"`;

export async function listMeasurements(db: Queryable, deviceId: string): Promise<Measurement[]> {
  const r = await db.query<Measurement>(`SELECT ${COLS} FROM measurements WHERE device_id = $1 ORDER BY measured_on`, [
    deviceId,
  ]);
  return r.rows;
}

export async function upsertMeasurement(db: Queryable, deviceId: string, m: Measurement): Promise<Measurement> {
  const r = await db.query<Measurement>(
    `INSERT INTO measurements (device_id, measured_on, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (device_id, measured_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, waist_cm = EXCLUDED.waist_cm,
       hip_cm = EXCLUDED.hip_cm, chest_cm = EXCLUDED.chest_cm, arm_cm = EXCLUDED.arm_cm, thigh_cm = EXCLUDED.thigh_cm
     RETURNING ${COLS}`,
    [deviceId, m.date, m.weightKg, m.waistCm, m.hipCm, m.chestCm, m.armCm, m.thighCm],
  );
  const row = r.rows[0];
  if (!row) throw new Error('upsert de medida sem retorno');
  return row;
}

export async function lastMeasurementDate(db: Queryable, deviceId: string): Promise<IsoDate | null> {
  const r = await db.query<{ d: IsoDate | null }>(
    `SELECT max(measured_on) AS d FROM measurements WHERE device_id = $1`,
    [deviceId],
  );
  return r.rows[0]?.d ?? null;
}
