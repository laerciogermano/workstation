// Composition root HTTP: monta módulos, segurança e o error boundary central.
import { existsSync } from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { authRouter, requireAuth } from './modules/auth/routes.ts';
import { createAuthService } from './modules/auth/service.ts';
import { campaignsRouter } from './modules/campaigns/routes.ts';
import { createCampaignsRepository } from './modules/campaigns/repository.ts';
import { createListsRepository } from './modules/lists/repository.ts';
import { listsRouter } from './modules/lists/routes.ts';
import { unsubscribeRouter } from './modules/unsubscribe/routes.ts';
import type { Config } from './shared/config.ts';
import type { Db } from './shared/db.ts';
import { AppError } from './shared/errors.ts';
import type { Logger } from './shared/logger.ts';

export type AppDeps = { db: Db; config: Config; logger: Logger };

export function createApp({ db, config, logger }: AppDeps) {
  const app = express();
  const isProd = config.NODE_ENV === 'production';

  app.disable('x-powered-by');
  if (isProd) app.set('trust proxy', 1); // TLS termina no proxy reverso
  app.use(helmet());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false } }));

  app.get('/health/live', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/health/ready', async (_req, res) => {
    await db.query('select 1');
    res.json({ ok: true });
  });

  app.use('/u', unsubscribeRouter(db));

  const api = express.Router();
  // só JSON: formulários cross-site (CSRF clássico) não chegam a ser lidos
  api.use(express.json({ limit: '6mb' }));
  api.use(cookieParser());

  const auth = createAuthService(db);
  api.use('/auth', authRouter(auth, { secureCookie: isProd }));
  api.use(requireAuth(auth));
  api.use('/lists', listsRouter(createListsRepository(db)));
  api.use('/campaigns', campaignsRouter(createCampaignsRepository(db)));
  api.use((_req, _res, next) => next(new AppError(404, 'not_found', 'Rota não encontrada.')));
  app.use('/api', api);

  // Produção: a API serve o build do front no mesmo domínio (cookie SameSite=Strict sem CORS).
  const webDist = path.resolve(import.meta.dirname, '../../web/dist');
  if (isProd && existsSync(webDist)) {
    app.use(express.static(webDist, { index: false, maxAge: '1h' }));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    const pgCode = (err as { code?: string }).code;
    if (pgCode === '23505') {
      res.status(409).json({ error: { code: 'conflict', message: 'Registro duplicado.' } });
      return;
    }
    if ((err as { type?: string }).type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'too_large', message: 'Conteúdo grande demais.' } });
      return;
    }
    if ((err as { type?: string }).type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'invalid_json', message: 'JSON inválido.' } });
      return;
    }
    req.log.error({ err }, 'erro não tratado');
    // nunca devolver stack/PII ao cliente
    res.status(500).json({ error: { code: 'internal', message: 'Erro interno. Tente de novo.' } });
  };
  app.use(errorHandler);

  return app;
}
