import type { RequestHandler } from 'express';
import { AppError } from './errors.ts';

// Janela fixa em memória. Suficiente para um processo; com várias réplicas, mover para Postgres/Redis.
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req, _res, next) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return next(new AppError(429, 'too_many_requests', 'Muitas tentativas. Aguarde um minuto.'));
    }
    next();
  };
}
