import {
  CharacterBody,
  CharacterPatch,
  FeedQuery,
  NickParams,
  NickQuery,
  PostParams,
  SearchQuery,
} from '@fitness/contracts';
import { DEFAULT_SHARE, NICK_RE, normalizeNick } from '@fitness/domain';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../../app';
import { AppError, conflict, notFound, unprocessable } from '../../shared/errors';
import { parse } from '../../shared/http';
import { requireProfile } from '../profile/profile.service';
import { findCharacterByDevice, findCharacterByNick, findMyCharacter, queryFeed, shareOf } from './social.repo';
import { publicProfile, refreshPublicStats, searchCharacters } from './social.service';

const PG_UNIQUE = '23505';
const isUnique = (e: unknown): boolean => typeof e === 'object' && e !== null && 'code' in e && e.code === PG_UNIQUE;

export const socialRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    const { db, clock } = deps;
    app.addHook('preHandler', deps.auth);

    async function assertGym(gymId: string | null | undefined): Promise<void> {
      if (!gymId) return;
      const r = await db.query('SELECT 1 FROM gyms WHERE id = $1', [gymId]);
      if (!r.rowCount) throw unprocessable('GYM_UNKNOWN', 'Academia não encontrada');
    }

    /** Vitrine (RF-37, RF-39). Sem personagem é só leitura. */
    app.get('/v1/social/feed', async (req) => {
      const { scope } = parse(FeedQuery, req.query);
      let gymId: string | undefined;
      if (scope === 'gym') {
        const me = await findCharacterByDevice(db, req.deviceId);
        gymId = me?.gym_id ?? undefined;
        if (!gymId) return { posts: [] };
      }
      return { posts: await queryFeed(db, req.deviceId, gymId ? { gymId } : {}) };
    });

    app.get('/v1/social/nick-available', async (req) => {
      const nick = normalizeNick(parse(NickQuery, req.query).nick);
      const valid = NICK_RE.test(nick);
      return { valid, available: valid && !(await findCharacterByNick(db, nick)) };
    });

    /** Personagem público opcional (RF-42, RN-01b). Publicar exige onboarding (RN-02). */
    app.post('/v1/social/character', async (req, reply) => {
      const b = parse(CharacterBody, req.body);
      await requireProfile(db, req.deviceId);
      if (await findCharacterByDevice(db, req.deviceId))
        throw conflict('CHARACTER_EXISTS', 'Você já tem um personagem');
      await assertGym(b.gymId);
      try {
        await db.query(
          'INSERT INTO characters (device_id, nick, color, gym_id, opt_in, share) VALUES ($1,$2,$3,$4,$5,$6)',
          [req.deviceId, b.nick, b.color, b.gymId, b.optIn, JSON.stringify(DEFAULT_SHARE)],
        );
      } catch (e) {
        if (isUnique(e)) throw conflict('NICK_TAKEN', 'Já existe alguém com esse apelido');
        throw e;
      }
      await refreshPublicStats(db, req.deviceId, clock);
      reply.code(201);
      return findMyCharacter(db, req.deviceId);
    });

    /** Privacidade granular (RF-46, RN-17, RN-18) e vínculo com academia (RF-49). */
    app.patch('/v1/social/character', async (req) => {
      const b = parse(CharacterPatch, req.body);
      const c = await findCharacterByDevice(db, req.deviceId);
      if (!c) throw notFound('Personagem');
      if (b.gymId !== undefined) await assertGym(b.gymId);
      const share = { ...shareOf(c), ...(b.share ?? {}) };
      await db.query(`UPDATE characters SET opt_in = $2, share = $3, hide_history = $4, gym_id = $5 WHERE id = $1`, [
        c.id,
        b.optIn ?? c.opt_in,
        JSON.stringify(share),
        b.hideHistory ?? c.hide_history,
        b.gymId === undefined ? c.gym_id : b.gymId,
      ]);
      await refreshPublicStats(db, req.deviceId, clock);
      return findMyCharacter(db, req.deviceId);
    });

    app.delete('/v1/social/character', async (req, reply) => {
      await db.query('DELETE FROM characters WHERE device_id = $1', [req.deviceId]);
      reply.code(204);
    });

    app.get('/v1/social/characters', async (req) => {
      const q = parse(SearchQuery, req.query);
      let gymId: string | undefined;
      if (q.gym === 'mine') {
        gymId = (await findCharacterByDevice(db, req.deviceId))?.gym_id ?? undefined;
        if (!gymId) return { characters: [] };
      } else if (q.gym) gymId = q.gym;
      return { characters: await searchCharacters(db, req.deviceId, { q: q.q, goal: q.goal, gymId }) };
    });

    app.get('/v1/social/characters/:nick', async (req) => {
      const { nick } = parse(NickParams, req.params);
      const p = await publicProfile(db, req.deviceId, nick);
      if (!p) throw notFound('Personagem');
      return p;
    });

    /** Apoio (kudos, RF-41). Sem comentários nem DM no v1. */
    app.post('/v1/social/posts/:postId/kudos', async (req) => {
      const { postId } = parse(PostParams, req.params);
      const r = await db.query<{ device_id: string }>(
        `SELECT c.device_id FROM posts p JOIN characters c ON c.id = p.character_id
          WHERE p.id = $1 AND (c.opt_in OR NOT c.hide_history)`,
        [postId],
      );
      const owner = r.rows[0];
      if (!owner) throw notFound('Publicação');
      if (owner.device_id === req.deviceId)
        throw new AppError(422, 'OWN_POST', 'Não dá para apoiar a própria publicação');
      await db.query('INSERT INTO kudos (post_id, device_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
        postId,
        req.deviceId,
      ]);
      return kudoState(postId, req.deviceId);
    });

    app.delete('/v1/social/posts/:postId/kudos', async (req) => {
      const { postId } = parse(PostParams, req.params);
      await db.query('DELETE FROM kudos WHERE post_id = $1 AND device_id = $2', [postId, req.deviceId]);
      return kudoState(postId, req.deviceId);
    });

    async function kudoState(postId: string, deviceId: string) {
      const r = await db.query<{ n: string; mine: boolean }>(
        `SELECT count(*) AS n, bool_or(device_id = $2) AS mine FROM kudos WHERE post_id = $1`,
        [postId, deviceId],
      );
      return { kudos: Number(r.rows[0]?.n ?? 0), kudoed: r.rows[0]?.mine ?? false };
    }
  };
