import type { RequestHandler } from 'express';
import { FINGERPRINT_HEADER } from '@notinhas/contracts';
import type { Db } from '../../shared/db.js';
import { hmac } from '../../shared/security/crypto.js';
import type { TokenService } from './tokens.js';

/**
 * REQ-050: em toda requisição, identifica o visitante pelo fingerprint (hash com pepper) e
 * registra o IP como o servidor o vê (req.ip com trust proxy — nunca um IP enviado pelo front).
 * Também lê o access token opcional (Authorization: Bearer).
 */
export function identify(db: Db, tokens: TokenService, pepper: string): RequestHandler {
  return async (req, _res, next) => {
    try {
      const ip = req.ip ?? null;
      req.ctx = { ip, visitor: null, user: null };

      const auth = req.get('authorization');
      if (auth?.startsWith('Bearer ')) {
        const claims = await tokens.verify(auth.slice(7));
        req.ctx.user = { id: claims.uid, publicId: claims.sub, role: claims.role };
      }

      const fp = req.get(FINGERPRINT_HEADER);
      if (fp && fp.length >= 16 && fp.length <= 200) {
        const { rows } = await db.query<{ id: number; public_id: string }>(
          `INSERT INTO visitors (fingerprint_hash, first_ip, last_ip, user_id)
           VALUES ($1, $2, $2, $3)
           ON CONFLICT (fingerprint_hash) DO UPDATE
             SET last_ip = EXCLUDED.last_ip, last_seen_at = now(),
                 user_id = coalesce(visitors.user_id, EXCLUDED.user_id)
           RETURNING id, public_id`,
          [hmac(pepper, fp), ip, req.ctx.user?.id ?? null],
        );
        const v = rows[0];
        if (v) req.ctx.visitor = { id: v.id, publicId: v.public_id };
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
