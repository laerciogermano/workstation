import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance, type preHandlerAsyncHookHandler } from 'fastify';
import { bodyRoutes } from './modules/body/body.routes';
import { dietRoutes } from './modules/diet/diet.routes';
import { gymRoutes } from './modules/gyms/gyms.routes';
import { identityRoutes } from './modules/identity/identity.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { progressRoutes } from './modules/progress/progress.routes';
import { socialRoutes } from './modules/social/social.routes';
import { trainingRoutes } from './modules/training/training.routes';
import { deviceAuth } from './shared/auth';
import type { Clock } from './shared/clock';
import type { Db } from './shared/db';
import { AppError } from './shared/errors';

export interface AppDeps {
  db: Db;
  clock: Clock;
  auth: preHandlerAsyncHookHandler;
}

export interface AppOptions {
  db: Db;
  clock: Clock;
  logLevel?: string;
  corsOrigins?: string[];
  pretty?: boolean;
}

/** Monta a app sem escutar porta: testes usam `app.inject`. */
export async function buildApp(o: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: o.logLevel ?? 'info',
      // nunca logar token do aparelho
      redact: ['req.headers.authorization'],
      ...(o.pretty ? { transport: { target: 'pino-pretty' } } : {}),
    },
    trustProxy: true,
    bodyLimit: 64 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: o.corsOrigins ?? false, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
    }
    const e = err as { statusCode?: unknown; message?: unknown };
    const status = typeof e.statusCode === 'number' ? e.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'erro inesperado');
    const code = status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'INTERNAL' : 'BAD_REQUEST';
    const message = status >= 500 || typeof e.message !== 'string' ? 'Erro interno' : e.message;
    return reply.code(status).send({ error: { code, message } });
  });
  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } }),
  );

  // health: liveness não toca dependências; readiness confere o banco
  app.get('/health/live', async () => ({ ok: true }));
  app.get('/health/ready', async (_req, reply) => {
    try {
      await o.db.query('SELECT 1');
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });

  const deps: AppDeps = { db: o.db, clock: o.clock, auth: deviceAuth(o.db) };
  await app.register(identityRoutes(deps));
  await app.register(profileRoutes(deps));
  await app.register(dietRoutes(deps));
  await app.register(trainingRoutes(deps));
  await app.register(bodyRoutes(deps));
  await app.register(progressRoutes(deps));
  await app.register(socialRoutes(deps));
  await app.register(gymRoutes(deps));
  return app;
}
