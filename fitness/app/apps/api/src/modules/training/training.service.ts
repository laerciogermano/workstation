import type { TrainingDayResponse } from '@fitness/contracts';
import { type ExerciseId, type IsoDate, addDays, exerciseOf, n0, sessionFor, summarizeSession } from '@fitness/domain';
import type { Db } from '../../shared/db';
import { unprocessable } from '../../shared/errors';
import { requireProfile } from '../profile/profile.service';
import {
  bestLoadsBefore,
  findWorkoutDay,
  listLogs,
  upsertLog,
  upsertWorkoutDay,
  workoutDaysBetween,
} from './training.repo';

export async function getTrainingDay(db: Db, deviceId: string, date: IsoDate): Promise<TrainingDayResponse> {
  const { profile } = await requireProfile(db, deviceId);
  const session = sessionFor(date);
  const [logs, best, wd, last7] = await Promise.all([
    listLogs(db, deviceId, date),
    bestLoadsBefore(db, deviceId, date),
    findWorkoutDay(db, deviceId, date),
    workoutDaysBetween(db, deviceId, addDays(date, -6), date),
  ]);
  const summary = summarizeSession(session, logs, profile.weightKg);
  const prs = logs
    .filter((l) => summary.done.includes(l.exerciseId))
    .filter((l) => {
      const b = best[l.exerciseId];
      return b !== undefined && l.loadKg > b;
    })
    .map((l) => ({ exerciseId: l.exerciseId, loadKg: l.loadKg }));
  return {
    date,
    sessionId: session.id,
    logs: session.exercises.map(
      (id) => logs.find((l) => l.exerciseId === id) ?? { exerciseId: id, setsDone: 0, loadKg: exerciseOf(id).loadKg },
    ),
    summary,
    completedAt: wd?.completed_at.toISOString() ?? null,
    bestLoads: best as TrainingDayResponse['bestLoads'],
    prs,
    workoutsLast7: last7.length,
    bodyWeightKg: profile.weightKg,
  };
}

export async function logExercise(
  db: Db,
  deviceId: string,
  date: IsoDate,
  exerciseId: ExerciseId,
  setsDone: number,
  loadKg: number | undefined,
) {
  const session = sessionFor(date);
  if (!session.exercises.includes(exerciseId)) {
    throw unprocessable('NOT_IN_SESSION', 'Esse exercício não está na sessão do dia');
  }
  const x = exerciseOf(exerciseId);
  const current = (await listLogs(db, deviceId, date)).find((l) => l.exerciseId === exerciseId);
  await upsertLog(db, deviceId, date, {
    exerciseId,
    setsDone: Math.min(setsDone, x.sets),
    loadKg: loadKg ?? current?.loadKg ?? x.loadKg,
  });
  return getTrainingDay(db, deviceId, date);
}

/** Concluir sessão (RF-27, RN-12): só o que foi marcado entra no balanço e no card da vitrine. */
export async function completeSession(db: Db, deviceId: string, date: IsoDate) {
  const day = await getTrainingDay(db, deviceId, date);
  if (!day.summary.done.length) throw unprocessable('NOTHING_DONE', 'Marque ao menos um exercício completo');
  await upsertWorkoutDay(db, deviceId, {
    day: date,
    sessionId: day.sessionId,
    kcal: day.summary.kcal,
    minutes: day.summary.minutes,
    volumeKg: day.summary.volumeKg,
  });
  const session = sessionFor(date);
  const pr = day.prs[0];
  return {
    day,
    firstCompletion: day.completedAt === null,
    post: {
      kind: 'treino' as const,
      title: `${session.name} · ${session.modality}`,
      values: [
        ['Duração', `${day.summary.minutes} min`],
        ['Gasto', `${n0(day.summary.kcal)} kcal`],
        ...(day.summary.volumeKg ? [['Volume', `${n0(day.summary.volumeKg)} kg`]] : []),
      ] as [string, string][],
      pr: pr ? `${exerciseOf(pr.exerciseId).name.split(' ')[0]} · ${pr.loadKg} kg` : null,
    },
  };
}
