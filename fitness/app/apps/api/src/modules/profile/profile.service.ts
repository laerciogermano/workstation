import type { Profile, ProfileBody } from '@fitness/contracts';
import { DEFAULT_PANTRY, type Energy, type MetabolicProfile, clampMagnitude, energyOf } from '@fitness/domain';
import { type Db, type Queryable, withTx } from '../../shared/db';
import { AppError, unprocessable } from '../../shared/errors';
import { findProfile, upsertProfile } from './profile.repo';

export const toMetabolic = (p: Profile): MetabolicProfile => ({
  sex: p.sex,
  age: p.age,
  heightCm: p.heightCm,
  weightKg: p.weightKg,
  activity: p.activity,
  goal: p.goal,
  magnitudePct: p.magnitudePct,
});

/** RN-02: sem onboarding concluído não há dieta, treino nem avaliação. */
export async function requireProfile(db: Queryable, deviceId: string): Promise<{ profile: Profile; energy: Energy }> {
  const profile = await findProfile(db, deviceId);
  if (!profile) throw new AppError(409, 'ONBOARDING_REQUIRED', 'Conclua o cadastro para liberar o app');
  return { profile, energy: energyOf(toMetabolic(profile)) };
}

/**
 * Salva/recalcula o perfil (RF-09, RF-10, RN-07). Fora da faixa segura exige confirmação (RN-16).
 * No primeiro cadastro, semeia o estoque sugerido para o plano já nascer viável.
 */
export async function saveProfile(db: Db, deviceId: string, body: ProfileBody & { confirmExtreme: boolean }) {
  const mp: MetabolicProfile = { ...body, magnitudePct: clampMagnitude(body.goal, body.magnitudePct) };
  const energy = energyOf(mp);
  if (energy.extreme && !body.confirmExtreme) {
    throw unprocessable('EXTREME_NEEDS_CONFIRMATION', 'Fora da faixa segura: confirme para seguir', {
      target: energy.target,
      tmb: energy.tmb,
      magnitudePct: energy.magnitudePct,
    });
  }
  return withTx(db, async (tx) => {
    const before = await findProfile(tx, deviceId);
    const profile = await upsertProfile(tx, deviceId, {
      ...mp,
      extremeConfirmed: energy.extreme && body.confirmExtreme,
    });
    if (!before) {
      await tx.query(
        `INSERT INTO pantry_items (device_id, food_id) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING`,
        [deviceId, DEFAULT_PANTRY],
      );
    } else {
      // estratégia mudou → plano regenera sem preferências antigas (RN-07)
      await tx.query(`DELETE FROM meal_prefs WHERE device_id = $1`, [deviceId]);
    }
    return { profile, energy };
  });
}
