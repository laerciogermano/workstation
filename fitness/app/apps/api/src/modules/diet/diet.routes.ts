import { DateParams, ExtraBody, ExtraParams, MealLogBody, MealParams, PantryBody, PrefBody } from '@fitness/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { assertWritableDay, todayUtc } from '../../shared/clock';
import { notFound, unprocessable } from '../../shared/errors';
import { parse } from '../../shared/http';
import { requireProfile } from '../profile/profile.service';
import { publishIfAllowed, refreshPublicStats } from '../social/social.service';
import { addExtra, clearPrefs, removeExtra, replacePantry, setMealLog, setPref } from './diet.repo';
import { closeDay, getDietDay } from './diet.service';

export const dietRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    const { db, clock } = deps;
    app.addHook('preHandler', deps.auth);

    app.get('/v1/diet/:date', async (req) => {
      const { date } = parse(DateParams, req.params);
      return getDietDay(db, req.deviceId, date);
    });

    /** Estoque é a fronteira do plano (RN-10). Trocar estoque zera preferências: o plano regenera. */
    app.put('/v1/diet/pantry', async (req) => {
      const { foodIds } = parse(PantryBody, req.body);
      await requireProfile(db, req.deviceId);
      await replacePantry(db, req.deviceId, [...new Set(foodIds)]);
      await clearPrefs(db, req.deviceId);
      return getDietDay(db, req.deviceId, todayUtc(clock));
    });

    app.put('/v1/diet/prefs', async (req) => {
      const b = parse(PrefBody, req.body);
      const day = await getDietDay(db, req.deviceId, todayUtc(clock));
      const meal = day.plan.meals.find((m) => m.id === b.mealId);
      if (b.foodId && !meal?.alternatives[b.category].includes(b.foodId)) {
        throw unprocessable('NOT_IN_PANTRY', 'Só é possível trocar por algo do estoque');
      }
      await setPref(db, req.deviceId, b.mealId, b.category, b.foodId);
      return { ok: true };
    });

    app.delete('/v1/diet/prefs', async (req, reply) => {
      await clearPrefs(db, req.deviceId);
      reply.code(204);
    });

    app.put('/v1/diet/:date/meals/:mealId', async (req) => {
      const { date, mealId } = parse(MealParams, req.params);
      const { status } = parse(MealLogBody, req.body);
      assertWritableDay(clock, date);
      await requireProfile(db, req.deviceId);
      await setMealLog(db, req.deviceId, date, mealId, status);
      return getDietDay(db, req.deviceId, date);
    });

    app.post('/v1/diet/:date/extras', async (req, reply) => {
      const { date } = parse(DateParams, req.params);
      const x = parse(ExtraBody, req.body);
      assertWritableDay(clock, date);
      await requireProfile(db, req.deviceId);
      await addExtra(db, req.deviceId, date, x);
      reply.code(201);
      return getDietDay(db, req.deviceId, date);
    });

    app.delete('/v1/diet/:date/extras/:extraId', async (req) => {
      const { date, extraId } = parse(ExtraParams, req.params);
      if (!(await removeExtra(db, req.deviceId, date, extraId))) throw notFound('Item');
      return getDietDay(db, req.deviceId, date);
    });

    app.post('/v1/diet/:date/close', async (req) => {
      const { date } = parse(DateParams, req.params);
      assertWritableDay(clock, date);
      const r = await closeDay(db, req.deviceId, date);
      let published = false;
      if (r.firstTimeCumpriu) published = await publishIfAllowed(db, req.deviceId, 'dieta', r.post);
      await refreshPublicStats(db, req.deviceId, clock);
      return { status: r.status, published };
    });
  };
