import type { Request } from 'express';
import { AppError } from './problem.js';

export interface RequestContext {
  ip: string | null;
  visitor: { id: number; publicId: string } | null;
  user: { id: number; publicId: string; role: 'user' | 'admin' } | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    ctx: RequestContext;
  }
}

/** Dono de dado pessoal: conta quando logado, senão o visitante (REQ-050/RN-14). */
export type Owner = { userId: number; visitorId: null } | { userId: null; visitorId: number };

export function ownerOf(req: Request): Owner {
  const { user, visitor } = req.ctx;
  if (user) return { userId: user.id, visitorId: null };
  if (visitor) return { userId: null, visitorId: visitor.id };
  throw new AppError('VALIDATION_FAILED', 'Identificador do navegador ausente (X-Client-Fingerprint).');
}

export function maybeOwnerOf(req: Request): Owner | null {
  const { user, visitor } = req.ctx;
  if (user) return { userId: user.id, visitorId: null };
  if (visitor) return { userId: null, visitorId: visitor.id };
  return null;
}

/** SQL de posse: `alias.user_id = $n` ou `alias.visitor_id = $n AND alias.user_id IS NULL`. */
export function ownerSql(owner: Owner, alias: string, paramIndex: number): { sql: string; param: number } {
  return owner.userId !== null
    ? { sql: `${alias}.user_id = $${paramIndex}`, param: owner.userId }
    : { sql: `${alias}.visitor_id = $${paramIndex} AND ${alias}.user_id IS NULL`, param: owner.visitorId };
}

export function requireUser(req: Request): NonNullable<RequestContext['user']> {
  if (!req.ctx.user) throw new AppError('UNAUTHENTICATED');
  return req.ctx.user;
}

export function requireAdmin(req: Request): NonNullable<RequestContext['user']> {
  const u = requireUser(req);
  if (u.role !== 'admin') throw new AppError('FORBIDDEN');
  return u;
}
