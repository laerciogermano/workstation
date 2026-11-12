import { type Gym, GymParams, GymsQuery } from '@fitness/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import type { Queryable } from '../../shared/db';
import { notFound } from '../../shared/errors';
import { parse } from '../../shared/http';
import { likeContains } from '../../shared/sql';
import { queryFeed } from '../social/social.repo';

/** Raio máximo da busca por proximidade. */
const RADIUS_KM = 25;

interface GymRow {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  modalities: string[];
  hours: string;
  distance_km: number | null;
  characters: number;
}

const toGym = (r: GymRow): Gym => ({
  id: r.id,
  name: r.name,
  neighborhood: r.neighborhood,
  city: r.city,
  lat: r.lat,
  lng: r.lng,
  modalities: r.modalities,
  hours: r.hours,
  distanceKm: r.distance_km === null ? null : Math.round(r.distance_km * 10) / 10,
  characters: r.characters,
});

/** Haversine em SQL (sem PostGIS no v1, ADR-0007). */
async function listGyms(
  db: Queryable,
  q: { lat?: number; lng?: number; text?: string; id?: string },
): Promise<GymRow[]> {
  const params: unknown[] = [q.lat ?? null, q.lng ?? null];
  const where: string[] = [];
  if (q.text) {
    params.push(likeContains(q.text));
    const i = params.length;
    where.push(`(g.name ILIKE $${i} OR g.neighborhood ILIKE $${i} OR g.city ILIKE $${i})`);
  }
  if (q.id) {
    params.push(q.id);
    where.push(`g.id = $${params.length}`);
  }
  const r = await db.query<GymRow>(
    `SELECT * FROM (
       SELECT g.id, g.name, g.neighborhood, g.city, g.lat, g.lng, g.modalities, g.hours,
              CASE WHEN $1::float8 IS NULL OR $2::float8 IS NULL THEN NULL ELSE
                6371 * 2 * asin(sqrt(power(sin(radians(g.lat - $1::float8) / 2), 2) +
                  cos(radians($1::float8)) * cos(radians(g.lat)) * power(sin(radians(g.lng - $2::float8) / 2), 2)))
              END AS distance_km,
              (SELECT count(*)::int FROM characters c WHERE c.gym_id = g.id AND c.opt_in) AS characters
         FROM gyms g ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ) x
     WHERE ${q.id ? 'true' : `x.distance_km IS NULL OR x.distance_km <= ${RADIUS_KM}`}
     ORDER BY x.distance_km NULLS LAST, x.name
     LIMIT 30`,
    params,
  );
  return r.rows;
}

export const gymRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    const { db } = deps;
    app.addHook('preHandler', deps.auth);

    /** GPS com permissão ou busca textual (RF-47, RN-20). */
    app.get('/v1/gyms', async (req) => {
      const q = parse(GymsQuery, req.query);
      const rows = await listGyms(db, {
        ...(q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : {}),
        ...(q.q ? { text: q.q } : {}),
      });
      return { gyms: rows.map(toGym) };
    });

    /** Academia (RF-48, RF-50): quem treina aqui e atividade local. Sem matrícula (RN-21). */
    app.get('/v1/gyms/:gymId', async (req) => {
      const { gymId } = parse(GymParams, req.params);
      const q = parse(GymsQuery, req.query);
      const row = (
        await listGyms(db, {
          id: gymId,
          ...(q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : {}),
        })
      )[0];
      if (!row) throw notFound('Academia');
      const people = await db.query<{ nick: string; color: number }>(
        'SELECT nick, color FROM characters WHERE gym_id = $1 AND opt_in ORDER BY nick LIMIT 30',
        [gymId],
      );
      return { ...toGym(row), people: people.rows, posts: await queryFeed(db, req.deviceId, { gymId, limit: 20 }) };
    });
  };
