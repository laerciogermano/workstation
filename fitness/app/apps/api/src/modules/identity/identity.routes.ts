import { CreateDeviceBody } from '@fitness/contracts';
import { energyOf } from '@fitness/domain';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { hashToken, newToken } from '../../shared/auth';
import { parse } from '../../shared/http';
import { findProfile } from '../profile/profile.repo';
import { toMetabolic } from '../profile/profile.service';
import { findMyCharacter } from '../social/social.repo';

/**
 * Identidade sem conta (RF-01..04). O token é o vínculo do aparelho; o fingerprint é só um
 * rótulo de diagnóstico (colisão/perda documentadas na ADR-0003).
 */
export const identityRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    app.post('/v1/devices', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
      const body = parse(CreateDeviceBody, req.body ?? {});
      const token = newToken();
      const r = await deps.db.query<{ id: string }>(
        `INSERT INTO devices (token_hash, fingerprint) VALUES ($1, $2) RETURNING id`,
        [hashToken(token), body.fingerprint ?? null],
      );
      reply.code(201);
      return { deviceId: r.rows[0]?.id, token };
    });

    app.get('/v1/me', { preHandler: deps.auth }, async (req) => {
      const d = await deps.db.query<{ created_at: Date }>(`SELECT created_at FROM devices WHERE id = $1`, [
        req.deviceId,
      ]);
      const profile = await findProfile(deps.db, req.deviceId);
      return {
        deviceId: req.deviceId,
        createdAt: d.rows[0]?.created_at.toISOString() ?? new Date(0).toISOString(),
        profile,
        energy: profile ? energyOf(toMetabolic(profile)) : null,
        character: await findMyCharacter(deps.db, req.deviceId),
      };
    });

    /** Apagar tudo deste aparelho (RNF-01). Cascata remove perfil, registros e personagem. */
    app.delete('/v1/me', { preHandler: deps.auth }, async (req, reply) => {
      await deps.db.query(`DELETE FROM devices WHERE id = $1`, [req.deviceId]);
      reply.code(204);
    });
  };
