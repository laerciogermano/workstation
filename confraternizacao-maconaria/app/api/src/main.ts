import 'reflect-metadata';
import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { config } from './config.js';

/** erro inesperado vai para o log; a resposta não revela detalhes */
@Catch()
class Errors extends BaseExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    if (error instanceof HttpException) return super.catch(error, host);
    if (error?.code === '23505') return super.catch(new HttpException('Esse registro já existe.', 409), host);
    if (error?.type === 'entity.too.large') return super.catch(new HttpException('Envio grande demais.', 413), host);
    new Logger('Erro').error(error?.stack ?? error);
    return super.catch(new HttpException('Algo deu errado. Tente de novo.', 500), host);
  }
}

const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: ['error', 'warn', 'log'] });
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:', 'blob:'], styleSrc: ["'self'", "'unsafe-inline'"], connectSrc: ["'self'"], upgradeInsecureRequests: config.production ? [] : null } },
  hsts: config.production,
}));
app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());
app.setGlobalPrefix('api');
app.useGlobalFilters(new Errors(app.get(HttpAdapterHost).httpAdapter));
app.enableShutdownHooks();

// o mesmo processo entrega o app web (em produção o Nginx faz isso)
const web = join(import.meta.dirname, '../../web/dist');
if (existsSync(web)) {
  app.use(express.static(web, { index: false }));
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) =>
    req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.') ? res.sendFile(join(web, 'index.html')) : next());
}

await app.listen(config.port, config.production ? '0.0.0.0' : '127.0.0.1');
new Logger('App').log(`Confraternização em http://localhost:${config.port}${config.devTools ? ' (modo desenvolvimento)' : ''}`);
