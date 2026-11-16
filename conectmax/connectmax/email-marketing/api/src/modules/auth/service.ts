import { createHash, randomBytes } from 'node:crypto';
import type { Db } from '../../shared/db.ts';
import { hashPassword, verifyPassword } from './password.ts';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type Operator = { id: string; email: string };

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export function createAuthService(db: Db) {
  // hash fixo para gastar o mesmo tempo quando o e-mail não existe (sem enumeração por timing)
  const dummyHash = hashPassword('dummy-password-for-timing');

  return {
    async login(email: string, password: string): Promise<{ token: string; expiresAt: Date } | null> {
      const { rows } = await db.query<{ id: string; password_hash: string }>(
        'select id, password_hash from operators where email = $1',
        [email],
      );
      const row = rows[0];
      const ok = await verifyPassword(password, row?.password_hash ?? (await dummyHash));
      if (!row || !ok) return null;
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await db.query('insert into sessions (token_hash, operator_id, expires_at) values ($1, $2, $3)', [
        sha256(token),
        row.id,
        expiresAt,
      ]);
      await db.query('delete from sessions where expires_at < now()');
      return { token, expiresAt };
    },

    async resolve(token: string): Promise<Operator | null> {
      const { rows } = await db.query<{ public_id: string; email: string }>(
        `select o.public_id, o.email
           from sessions s
           join operators o on o.id = s.operator_id
          where s.token_hash = $1 and s.expires_at > now()`,
        [sha256(token)],
      );
      const row = rows[0];
      return row ? { id: row.public_id, email: row.email } : null;
    },

    async logout(token: string): Promise<void> {
      await db.query('delete from sessions where token_hash = $1', [sha256(token)]);
    },

    /** Cria o operador ou troca a senha (derrubando as sessões existentes). */
    async upsertOperator(email: string, password: string): Promise<void> {
      const hash = await hashPassword(password);
      const { rows } = await db.query<{ id: string }>(
        `insert into operators (email, password_hash) values ($1, $2)
         on conflict (email) do update set password_hash = excluded.password_hash
         returning id`,
        [email, hash],
      );
      await db.query('delete from sessions where operator_id = $1', [rows[0]!.id]);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
