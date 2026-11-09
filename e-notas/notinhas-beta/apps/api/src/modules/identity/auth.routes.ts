import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import {
  DeleteAccountSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  type SessionDTO,
} from '@notinhas/contracts';
import type { Deps } from '../../shared/deps.js';
import { withTx, type Tx } from '../../shared/db.js';
import { requireUser } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import { parse } from '../../shared/http/validate.js';
import { DUMMY_HASH, hashPassword, randomToken, sha256, verifyPassword } from '../../shared/security/crypto.js';
import { buildMe, mergeVisitorIntoUser } from './identity.service.js';
import { ACCESS_TTL_S, REFRESH_COOKIE, REFRESH_TTL_DAYS } from './tokens.js';

type UserRow = { id: number; public_id: string; role: 'user' | 'admin'; password_hash: string };

export function authRoutes(deps: Deps): Router {
  const { db, tokens, env, mailer, log } = deps;
  const r = Router();
  const secure = env.NODE_ENV === 'production';

  async function issueSession(tx: Tx, req: Request, res: Response, user: UserRow, familyId: string = randomUUID()) {
    const refresh = randomToken();
    await tx.query(
      `INSERT INTO sessions (user_id, token_hash, family_id, user_agent, ip, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + make_interval(days => $6))`,
      [user.id, sha256(refresh), familyId, req.get('user-agent')?.slice(0, 300) ?? null, req.ip ?? null, REFRESH_TTL_DAYS],
    );
    res.cookie(REFRESH_COOKIE, refresh, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_TTL_DAYS * 86_400_000,
    });
    req.ctx.user = { id: user.id, publicId: user.public_id, role: user.role };
    return tokens.sign({ sub: user.public_id, uid: user.id, role: user.role });
  }

  async function sessionResponse(req: Request, accessToken: string): Promise<SessionDTO> {
    return { accessToken, expiresIn: ACCESS_TTL_S, me: await buildMe(db, req.ctx) };
  }

  // US-01.01 · T-02 — cria conta e leva o que estava no fingerprint (merge)
  r.post('/register', async (req, res) => {
    const body = parse(RegisterSchema, req.body);
    const passwordHash = await hashPassword(body.password);
    const token = await withTx(db, async (tx) => {
      const { rows } = await tx.query<UserRow>(
        `INSERT INTO users (email, password_hash, name, is_store_opt_in) VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) WHERE deleted_at IS NULL DO NOTHING
         RETURNING id, public_id, role, password_hash`,
        [body.email, passwordHash, body.name ?? null, body.storeOptIn],
      );
      const user = rows[0];
      if (!user) throw new AppError('EMAIL_TAKEN');
      if (req.ctx.visitor) await mergeVisitorIntoUser(tx, req.ctx.visitor.id, user.id);
      return issueSession(tx, req, res, user);
    });
    res.status(201).json(await sessionResponse(req, token));
  });

  // US-01.02 · T-03 — erro sempre genérico; login no mesmo navegador também faz merge
  r.post('/login', async (req, res) => {
    const body = parse(LoginSchema, req.body);
    const { rows } = await db.query<UserRow>(
      'SELECT id, public_id, role, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL',
      [body.email],
    );
    const user = rows[0];
    const valid = await verifyPassword(body.password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !valid) throw new AppError('INVALID_CREDENTIALS');
    const token = await withTx(db, async (tx) => {
      if (req.ctx.visitor) await mergeVisitorIntoUser(tx, req.ctx.visitor.id, user.id);
      return issueSession(tx, req, res, user);
    });
    res.json(await sessionResponse(req, token));
  });

  // Rotação do refresh com detecção de reuso: token já trocado → revoga a família inteira.
  r.post('/refresh', async (req, res) => {
    const raw: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof raw !== 'string' || !raw) throw new AppError('UNAUTHENTICATED');
    const out = await withTx(db, async (tx) => {
      const { rows } = await tx.query<UserRow & { session_id: number; family_id: string; revoked_at: Date | null; replaced_at: Date | null; expires_at: Date }>(
        `SELECT s.id AS session_id, s.family_id, s.revoked_at, s.replaced_at, s.expires_at,
                u.id, u.public_id, u.role, u.password_hash
         FROM sessions s JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
         WHERE s.token_hash = $1 FOR UPDATE OF s`,
        [sha256(raw)],
      );
      const s = rows[0];
      if (!s) throw new AppError('UNAUTHENTICATED');
      // reuso: a revogação precisa ser gravada (commit), então não lançamos aqui dentro
      if (s.replaced_at || s.revoked_at) {
        await tx.query('UPDATE sessions SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL', [s.family_id]);
        return { reused: s.family_id } as const;
      }
      if (s.expires_at < new Date()) throw new AppError('TOKEN_EXPIRED');
      await tx.query('UPDATE sessions SET replaced_at = now() WHERE id = $1', [s.session_id]);
      return { token: await issueSession(tx, req, res, s, s.family_id) } as const;
    });
    if ('reused' in out) {
      log.warn({ family: out.reused }, 'refresh token reutilizado: família revogada');
      res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
      throw new AppError('REFRESH_REUSED');
    }
    res.json(await sessionResponse(req, out.token));
  });

  r.post('/logout', async (req, res) => {
    const raw: unknown = req.cookies?.[REFRESH_COOKIE];
    const everywhere = req.body?.everywhere === true;
    if (everywhere && req.ctx.user) {
      await db.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [req.ctx.user.id]);
    } else if (typeof raw === 'string' && raw) {
      await db.query('UPDATE sessions SET revoked_at = now() WHERE token_hash = $1', [sha256(raw)]);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.status(204).end();
  });

  // US-01.04 · T-04 — resposta igual exista ou não a conta; link de uso único, 1 h
  r.post('/forgot-password', async (req, res) => {
    const { email } = parse(ForgotPasswordSchema, req.body);
    const { rows } = await db.query<{ id: number }>('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    const user = rows[0];
    if (user) {
      const token = randomToken();
      await db.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')`,
        [user.id, sha256(token)],
      );
      const link = `${env.PUBLIC_URL}/conta/redefinir?token=${token}`;
      await mailer
        .send({
          to: email,
          subject: 'Redefinir sua senha no notinhas.shop',
          text: `Recebemos um pedido para redefinir sua senha.\n\nAbra o link em até 1 hora:\n${link}\n\nSe não foi você, ignore este e-mail.`,
        })
        .catch((err: unknown) => log.error({ err }, 'falha ao enviar e-mail de reset'));
    }
    res.status(202).json({ ok: true });
  });

  r.post('/reset-password', async (req, res) => {
    const body = parse(ResetPasswordSchema, req.body);
    const hash = await hashPassword(body.newPassword);
    await withTx(db, async (tx) => {
      const { rows } = await tx.query<{ id: number; user_id: number }>(
        `UPDATE password_resets SET used_at = now()
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
         RETURNING id, user_id`,
        [sha256(body.token)],
      );
      const row = rows[0];
      if (!row) throw new AppError('VALIDATION_FAILED', 'Link inválido ou expirado. Peça um novo.');
      await tx.query('UPDATE users SET password_hash = $2 WHERE id = $1', [row.user_id, hash]);
      await tx.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [row.user_id]);
    });
    res.json({ ok: true });
  });

  return r;
}

export function meRoutes(deps: Deps): Router {
  const { db } = deps;
  const r = Router();

  r.get('/', async (req, res) => {
    res.json(await buildMe(db, req.ctx));
  });

  // US-01.12 · T-56 — some: conta, notas pessoais, listas, pontos, vínculos de fingerprint/IP.
  // Fica: preços no índice público (já anônimos — RN-06).
  r.delete('/', async (req, res) => {
    const user = requireUser(req);
    parse(DeleteAccountSchema, req.body);
    await withTx(db, async (tx) => {
      await tx.query('DELETE FROM receipt_owners WHERE user_id = $1', [user.id]);
      await tx.query('DELETE FROM shopping_lists WHERE user_id = $1', [user.id]);
      await tx.query('DELETE FROM point_events WHERE user_id = $1', [user.id]);
      await tx.query('DELETE FROM usage_events WHERE user_id = $1', [user.id]);
      await tx.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
      await tx.query('UPDATE ingest_failures SET user_id = NULL, visitor_id = NULL WHERE user_id = $1', [user.id]);
      await tx.query('DELETE FROM visitors WHERE user_id = $1', [user.id]);
      await tx.query('UPDATE barcode_links SET linked_by_user_id = NULL WHERE linked_by_user_id = $1', [user.id]);
      await tx.query('UPDATE barcode_registrations SET linked_by_user_id = NULL WHERE linked_by_user_id = $1', [user.id]);
      await tx.query('UPDATE photo_registrations SET linked_by_user_id = NULL WHERE linked_by_user_id = $1', [user.id]);
      await tx.query(
        `UPDATE users SET email = 'excluido-' || public_id || '@invalid', password_hash = '!', name = NULL,
                          is_store_opt_in = false, deleted_at = now() WHERE id = $1`,
        [user.id],
      );
      await tx.query(`INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES (NULL, 'account_deleted', 'user', $1)`, [
        user.publicId,
      ]);
    });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.status(202).json({ ok: true });
  });

  return r;
}
