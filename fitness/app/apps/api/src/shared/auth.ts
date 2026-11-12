import { createHash, randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from './db';
import { AppError } from './errors';

export const newToken = (): string => randomBytes(32).toString('base64url');
export const hashToken = (t: string): string => createHash('sha256').update(t).digest('hex');

declare module 'fastify' {
  interface FastifyRequest {
    deviceId: string;
  }
}

/**
 * Autenticação por aparelho (ADR-0003): `Authorization: Bearer <token>`.
 * Aparelho desconhecido → 401 DEVICE_UNKNOWN (o cliente mostra "Aparelho novo", RF-04).
 */
export function deviceAuth(db: Db) {
  return async function requireDevice(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    if (!token) throw new AppError(401, 'DEVICE_REQUIRED', 'Aparelho não identificado');
    const r = await db.query<{ id: string }>(
      `UPDATE devices SET last_seen_at = now() WHERE token_hash = $1 RETURNING id`,
      [hashToken(token)],
    );
    const row = r.rows[0];
    if (!row) throw new AppError(401, 'DEVICE_UNKNOWN', 'Este aparelho é novo para nós');
    req.deviceId = row.id;
  };
}
