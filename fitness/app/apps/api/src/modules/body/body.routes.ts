import { DateParams, MeasurementBody } from '@fitness/contracts';
import { energyOf, sgn } from '@fitness/domain';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { assertWritableDay } from '../../shared/clock';
import { withTx } from '../../shared/db';
import { parse } from '../../shared/http';
import { updateWeight } from '../profile/profile.repo';
import { requireProfile, toMetabolic } from '../profile/profile.service';
import { publishIfAllowed, refreshPublicStats } from '../social/social.service';
import { listMeasurements, upsertMeasurement } from './body.repo';

export const bodyRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    const { db, clock } = deps;
    app.addHook('preHandler', deps.auth);

    app.get('/v1/body', async (req) => {
      await requireProfile(db, req.deviceId);
      return { measurements: await listMeasurements(db, req.deviceId) };
    });

    /** Avaliação com fita (RF-29). Peso novo recalcula TMB, meta e macros (RN-07). */
    app.put('/v1/body/measurements/:date', async (req) => {
      const { date } = parse(DateParams, req.params);
      const b = parse(MeasurementBody, req.body);
      assertWritableDay(clock, date);
      const { profile, energy } = await requireProfile(db, req.deviceId);
      const measurement = await withTx(db, async (tx) => {
        const m = await upsertMeasurement(tx, req.deviceId, { date, ...b });
        await updateWeight(tx, req.deviceId, b.weightKg);
        return m;
      });
      const after = energyOf({ ...toMetabolic(profile), weightKg: b.weightKg });
      const all = await listMeasurements(db, req.deviceId);
      const first = all[0];
      if (first && all.length > 1) {
        await publishIfAllowed(db, req.deviceId, 'medidas', {
          kind: 'medida',
          title: 'Avaliação registrada',
          values: [
            ['Cintura', `${sgn(b.waistCm - first.waistCm)} cm`],
            ['Registros', String(all.length)],
          ],
        });
      }
      await refreshPublicStats(db, req.deviceId, clock);
      return { measurement, targetBefore: energy.target, targetAfter: after.target };
    });
  };
