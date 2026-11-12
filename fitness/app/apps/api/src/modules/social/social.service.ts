import type { CharacterCard, PublicProfileResponse } from '@fitness/contracts';
import {
  type GoalId,
  type PostKind,
  type PublicStats,
  type ShareKey,
  achievementsOf,
  addDays,
  daysBetween,
  exerciseOf,
  isExerciseId,
  sgn,
  toPublicStats,
} from '@fitness/domain';
import { type Clock, todayUtc } from '../../shared/clock';
import type { Db, Queryable } from '../../shared/db';
import { likeContains } from '../../shared/sql';
import { listMeasurements } from '../body/body.repo';
import { listClosedDays } from '../diet/diet.repo';
import { findProfile } from '../profile/profile.repo';
import { streakFor } from '../progress/progress.service';
import { countWorkouts } from '../training/training.repo';
import { findCharacterByDevice, insertPost, queryFeed, shareOf } from './social.repo';

export interface PostDraft {
  kind: PostKind;
  title: string;
  values: [string, string][];
  pr?: string | null;
  achievement?: string | null;
}

/**
 * Publica só com personagem + vitrine ligada + toggle do tipo de dado ligado (RF-38, RN-17, RN-18).
 * Medidas exigem "medidas" ou "resumo de evolução" ligados.
 */
export async function publishIfAllowed(
  db: Queryable,
  deviceId: string,
  key: ShareKey,
  post: PostDraft,
): Promise<boolean> {
  const c = await findCharacterByDevice(db, deviceId);
  if (!c?.opt_in) return false;
  const share = shareOf(c);
  const allowed = key === 'medidas' ? share.medidas || share.evolucao : share[key];
  if (!allowed) return false;
  await insertPost(db, c.id, post);
  return true;
}

const shortName = (id: string): string => (isExerciseId(id) ? (exerciseOf(id).name.split(' ')[0] ?? id) : id);

async function topPrs(db: Queryable, deviceId: string): Promise<string[]> {
  const r = await db.query<{ exercise_id: string; load_kg: number }>(
    `SELECT wl.exercise_id, max(wl.load_kg) AS load_kg
       FROM workout_logs wl JOIN workout_days wd ON wd.device_id = wl.device_id AND wd.day = wl.day
      WHERE wl.device_id = $1 AND wl.load_kg > 0
      GROUP BY wl.exercise_id ORDER BY max(wl.load_kg) DESC LIMIT 3`,
    [deviceId],
  );
  return r.rows.map((x) => `${shortName(x.exercise_id)} · ${x.load_kg} kg`);
}

/**
 * Snapshot público (ADR-0006): recalculado a cada ação real e já filtrado pelos toggles.
 * Nada privado (TMB, peso, medidas) é guardado aqui sem o toggle correspondente.
 */
export async function refreshPublicStats(db: Db, deviceId: string, clock: Clock): Promise<void> {
  const c = await findCharacterByDevice(db, deviceId);
  if (!c) return;
  const profile = await findProfile(db, deviceId);
  if (!profile) return;
  const today = todayUtc(clock);
  const [streak, workouts, prs, ms, closed] = await Promise.all([
    streakFor(db, deviceId, today),
    countWorkouts(db, deviceId),
    topPrs(db, deviceId),
    listMeasurements(db, deviceId),
    listClosedDays(db, deviceId, addDays(today, -6), today),
  ]);
  const first = ms[0];
  const last = ms[ms.length - 1];
  const weeks = first && last ? Math.max(1, Math.round(daysBetween(first.date, last.date) / 7)) : 0;
  const evolution =
    first && last && ms.length > 1 ? `${sgn(last.waistCm - first.waistCm)} cm de cintura em ${weeks} semanas` : null;
  const stats = toPublicStats(
    {
      goal: profile.goal,
      streak,
      workouts,
      prs,
      achievements: achievementsOf({
        workouts,
        streak,
        proteinWeek: closed.filter((d) => d.protein_ok).length,
        measurements: ms.length,
      }),
      evolution,
    },
    shareOf(c),
  );
  await db.query('UPDATE characters SET public_stats = $2 WHERE id = $1', [c.id, JSON.stringify(stats)]);
}

interface CardRow {
  nick: string;
  color: number;
  gym_id: string | null;
  gym_name: string | null;
  public_stats: Partial<PublicStats>;
  mine: boolean;
}

/** Busca (RF-44, RN-19): só personagem público ativo. */
export async function searchCharacters(
  db: Queryable,
  viewer: string,
  f: { q?: string | undefined; goal?: GoalId | undefined; gymId?: string | undefined },
): Promise<CharacterCard[]> {
  const params: unknown[] = [viewer];
  const where = ['c.opt_in'];
  if (f.q) {
    params.push(likeContains(f.q.toLowerCase()));
    where.push(`c.nick LIKE $${params.length}`);
  }
  if (f.goal) {
    params.push(f.goal);
    where.push(`c.public_stats->>'goal' = $${params.length}`);
  }
  if (f.gymId) {
    params.push(f.gymId);
    where.push(`c.gym_id = $${params.length}`);
  }
  const r = await db.query<CardRow>(
    `SELECT c.nick, c.color, c.gym_id, g.name AS gym_name, c.public_stats, (c.device_id = $1) AS mine
       FROM characters c LEFT JOIN gyms g ON g.id = c.gym_id
      WHERE ${where.join(' AND ')}
      ORDER BY (c.device_id = $1) DESC, (c.public_stats->>'streak')::int DESC NULLS LAST, c.nick
      LIMIT 50`,
    params,
  );
  return r.rows.map((x) => ({
    nick: x.nick,
    color: x.color,
    gymId: x.gym_id,
    gymName: x.gym_name,
    goal: x.public_stats.goal ?? null,
    streak: x.public_stats.streak ?? null,
    topPr: x.public_stats.prs?.[0] ?? null,
    mine: x.mine,
  }));
}

export async function publicProfile(
  db: Queryable,
  viewer: string,
  nick: string,
): Promise<PublicProfileResponse | null> {
  const r = await db.query<CardRow & { id: string; opt_in: boolean }>(
    `SELECT c.id, c.nick, c.color, c.gym_id, g.name AS gym_name, c.public_stats, c.opt_in, (c.device_id = $1) AS mine
       FROM characters c LEFT JOIN gyms g ON g.id = c.gym_id WHERE c.nick = $2`,
    [viewer, nick],
  );
  const c = r.rows[0];
  if (!c || (!c.opt_in && !c.mine)) return null;
  const s = c.public_stats;
  return {
    nick: c.nick,
    color: c.color,
    gym: c.gym_id && c.gym_name ? { id: c.gym_id, name: c.gym_name } : null,
    stats: {
      goal: s.goal ?? null,
      streak: s.streak ?? null,
      workouts: s.workouts ?? null,
      prs: s.prs ?? [],
      achievements: s.achievements ?? [],
      evolution: s.evolution ?? null,
    },
    posts: await queryFeed(db, viewer, { characterId: c.id, limit: 20 }),
    mine: c.mine,
    visible: c.opt_in,
  };
}
