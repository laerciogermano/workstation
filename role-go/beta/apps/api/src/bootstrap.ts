import { type INestApplication, Logger, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { env } from './shared/env';

/** Monta a app HTTP (usada pelo main e pelos testes de integração). */
export async function createApp(opts: { logger?: boolean } = {}): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: opts.logger === false ? false : ['log', 'warn', 'error'], bodyParser: false });
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false, // a CSP do HTML é do nginx (docs/10 §3); a API só devolve JSON e as páginas OG
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  if (opts.logger !== false) {
    app.use(
      pinoHttp({
        level: env().LOG_LEVEL,
        genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
        redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
        serializers: { req: (r: { method: string; url: string; id: string }) => ({ id: r.id, method: r.method, url: r.url.replace(/token=[^&]+/, 'token=***') }) },
        autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
        ...(env().NODE_ENV === 'development' ? { transport: { target: 'pino-pretty', options: { singleLine: true } } } : {}),
      }),
    );
  }
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '200kb' });
  // /media: o nginx serve em produção; em dev a própria API serve com cache imutável
  app.use('/media', express.static(path.resolve(env().MEDIA_DIR), { immutable: true, maxAge: '365d', fallthrough: false }));
  app.setGlobalPrefix('api/v1', { exclude: [{ path: 'e/:slug', method: RequestMethod.GET }, { path: 'o/:slug', method: RequestMethod.GET }] });
  app.enableShutdownHooks();
  return app;
}

export async function listen(app: INestApplication): Promise<void> {
  await app.listen(env().PORT);
  new Logger('Bootstrap').log(`RoleGo API em http://localhost:${env().PORT}/api/v1`);
}
