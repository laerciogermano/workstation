import express, { Router } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { Deps } from './shared/deps.js';
import { AppError } from './shared/http/problem.js';
import { errorHandler, notFound, requireCsrfHeader } from './shared/http/middleware.js';
import { identify } from './modules/identity/identity.middleware.js';
import { authRoutes, meRoutes } from './modules/identity/auth.routes.js';
import { receiptsRoutes } from './modules/receipts/receipts.routes.js';
import { barcodesRoutes } from './modules/barcodes/barcodes.routes.js';
import { imageProxyHandler } from './modules/barcodes/image-proxy.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { listsRoutes } from './modules/lists/lists.routes.js';
import { pointsRoutes, spendingRoutes } from './modules/spending/spending.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

export function createApp(deps: Deps) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback'); // nginx na mesma máquina: req.ip = IP público real (REQ-050)

  app.use(
    pinoHttp({
      logger: deps.log,
      genReqId: (req, res) => {
        const id = req.headers['x-request-id']?.toString() ?? randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === '/health' || req.url?.startsWith('/api/v1/imagens/') },
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP do front é servida pelo nginx/vite (ver deploy/)
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  // Liveness / readiness (Express health + graceful shutdown)
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/ready', async (_req, res) => {
    try {
      await deps.db.query('SELECT 1');
      res.json({ ok: true, db: 'up' });
    } catch {
      res.status(503).json({ ok: false, db: 'down' });
    }
  });

  // Público: <img> não envia fingerprint/CSRF — só hosts allowlist (SI5 etc.)
  app.get('/api/v1/imagens/proxy', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }), imageProxyHandler());

  const limiter = (limit: number, windowMs = 60_000) =>
    rateLimit({
      windowMs,
      limit,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, _res, next) => next(new AppError('RATE_LIMIT_EXCEEDED')),
    });

  const api = Router();
  api.use(limiter(300));
  api.use(requireCsrfHeader);
  api.use(identify(deps.db, deps.tokens, deps.env.FINGERPRINT_PEPPER));

  api.use('/auth', limiter(20), authRoutes(deps));
  api.use('/me', meRoutes(deps));
  api.use('/notas', limiter(30), invalidateOnWrite(deps), receiptsRoutes(deps));
  api.use('/codigos-barras', invalidateOnWrite(deps), barcodesRoutes(deps));
  api.use('/listas', listsRoutes(deps));
  api.use('/gastos', spendingRoutes(deps));
  api.use('/pontos', pointsRoutes(deps));
  api.use('/admin', adminRoutes(deps));
  api.use(catalogRoutes(deps));

  app.use('/api/v1', api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

/** Nova nota ou novo vínculo mudam o índice: invalida o snapshot depois de responder 2xx. */
function invalidateOnWrite(deps: Deps): express.RequestHandler {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      res.on('finish', () => {
        if (res.statusCode < 300) deps.index.invalidate();
      });
    }
    next();
  };
}
