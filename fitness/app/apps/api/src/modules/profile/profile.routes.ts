import { ProfileBody } from '@fitness/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { parse } from '../../shared/http';
import { refreshPublicStats } from '../social/social.service';
import { saveProfile } from './profile.service';

export const profileRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    app.put('/v1/profile', { preHandler: deps.auth }, async (req) => {
      const body = parse(ProfileBody, req.body);
      const out = await saveProfile(deps.db, req.deviceId, body);
      await refreshPublicStats(deps.db, req.deviceId, deps.clock);
      return out;
    });
  };
