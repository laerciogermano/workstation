import { CompleteSessionBody, DateParams, ExerciseLogBody, ExerciseParams } from '@fitness/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { assertWritableDay } from '../../shared/clock';
import { parse } from '../../shared/http';
import { streakFor } from '../progress/progress.service';
import { publishIfAllowed, refreshPublicStats } from '../social/social.service';
import { completeSession, getTrainingDay, logExercise } from './training.service';

export const trainingRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    const { db, clock } = deps;
    app.addHook('preHandler', deps.auth);

    app.get('/v1/training/:date', async (req) => {
      const { date } = parse(DateParams, req.params);
      return getTrainingDay(db, req.deviceId, date);
    });

    app.put('/v1/training/:date/exercises/:exerciseId', async (req) => {
      const { date, exerciseId } = parse(ExerciseParams, req.params);
      const b = parse(ExerciseLogBody, req.body);
      assertWritableDay(clock, date);
      return logExercise(db, req.deviceId, date, exerciseId, b.setsDone, b.loadKg);
    });

    app.post('/v1/training/:date/complete', async (req) => {
      const { date } = parse(DateParams, req.params);
      const { publish } = parse(CompleteSessionBody, req.body);
      assertWritableDay(clock, date);
      const r = await completeSession(db, req.deviceId, date);
      const published =
        publish && r.firstCompletion ? await publishIfAllowed(db, req.deviceId, 'treinos', r.post) : false;
      await refreshPublicStats(db, req.deviceId, clock);
      return { summary: r.day.summary, published, streak: await streakFor(db, req.deviceId, date) };
    });
  };
