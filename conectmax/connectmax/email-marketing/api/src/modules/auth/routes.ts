import { Router, type CookieOptions, type RequestHandler } from 'express';
import { z } from 'zod';
import { emailSchema } from '../../shared/email.ts';
import { AppError, unauthorized } from '../../shared/errors.ts';
import { rateLimit } from '../../shared/rate-limit.ts';
import { parse } from '../../shared/validate.ts';
import type { AuthService, Operator } from './service.ts';

export const SESSION_COOKIE = 'em_session';

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });

function cookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'strict', path: '/' };
}

function sessionToken(cookies: unknown): string | null {
  const token = (cookies as Record<string, unknown> | undefined)?.[SESSION_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/** Deny-by-default: montado antes de todas as rotas de /api, exceto /api/auth. */
export function requireAuth(auth: AuthService): RequestHandler {
  return async (req, res, next) => {
    const token = sessionToken(req.cookies);
    const operator = token ? await auth.resolve(token) : null;
    if (!operator) return next(unauthorized());
    res.locals.operator = operator satisfies Operator;
    next();
  };
}

export function authRouter(auth: AuthService, { secureCookie }: { secureCookie: boolean }) {
  const router = Router();

  router.post('/login', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const session = await auth.login(email, password);
    if (!session) throw new AppError(401, 'invalid_credentials', 'E-mail ou senha incorretos.');
    res.cookie(SESSION_COOKIE, session.token, { ...cookieOptions(secureCookie), expires: session.expiresAt });
    res.json({ email });
  });

  router.post('/logout', async (req, res) => {
    const token = sessionToken(req.cookies);
    if (token) await auth.logout(token);
    res.clearCookie(SESSION_COOKIE, cookieOptions(secureCookie));
    res.status(204).end();
  });

  router.get('/me', requireAuth(auth), (_req, res) => {
    const operator = res.locals.operator as Operator;
    res.json({ email: operator.email });
  });

  return router;
}
