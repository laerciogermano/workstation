import { DateParams } from '@fitness/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { parse } from '../../shared/http';
import { getProgress } from './progress.service';

export const progressRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    app.get('/v1/progress/:date', { preHandler: deps.auth }, async (req) => {
      const { date } = parse(DateParams, req.params);
      return getProgress(deps.db, req.deviceId, date);
    });
  };
