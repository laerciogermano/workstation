import type { ErrorRequestHandler, RequestHandler } from 'express';
import { CSRF_HEADER, CSRF_VALUE } from '@notinhas/contracts';
import { AppError } from './problem.js';

/** 06 §1: toda mutação exige X-Requested-With: notinhas (bloqueia CSRF por formulário simples). */
export const requireCsrfHeader: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get(CSRF_HEADER) !== CSRF_VALUE) return next(new AppError('CSRF_HEADER_MISSING'));
  next();
};

export const notFound: RequestHandler = (req, _res, next) => next(new AppError('NOT_FOUND', `Rota ${req.method} ${req.path} não existe.`));

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  void _next;
  const appErr =
    err instanceof AppError
      ? err
      : err?.type === 'entity.parse.failed'
        ? new AppError('VALIDATION_FAILED', 'JSON malformado.')
        : null;
  if (!appErr) req.log.error({ err }, 'erro inesperado');
  const e = appErr ?? new AppError('INTERNAL');
  res.status(e.status).type('application/problem+json').json(e.toProblem(req.originalUrl));
};
