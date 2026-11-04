import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ERRORS, type ErrorCode, type ProblemDetails } from '@rolego/contracts';
import type { Request, Response } from 'express';
import { AppError } from './app-error';

const kebab = (c: string) => c.toLowerCase().replace(/_/g, '-');

/** RFC 9457 Problem Details + code (docs/03 §5.2). */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger('Problem');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    let code: ErrorCode = 'INTERNAL';
    let detail: string | undefined;
    let extra: Partial<ProblemDetails> = {};

    if (exception instanceof AppError) {
      code = exception.code;
      detail = exception.detail;
      extra = exception.extra;
    } else if (exception instanceof ThrottlerException) {
      code = 'RATE_LIMITED';
    } else if (exception instanceof HttpException) {
      const s = exception.getStatus();
      code = s === 404 ? 'NOT_FOUND' : s === 401 ? 'UNAUTHENTICATED' : s === 403 ? 'FORBIDDEN' : s === 413 ? 'MEDIA_TOO_LARGE' : s === 429 ? 'RATE_LIMITED' : s >= 500 ? 'INTERNAL' : 'VALIDATION_FAILED';
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    const def = ERRORS[code];
    const body: ProblemDetails = {
      type: `https://rolego.com.br/errors/${kebab(code)}`,
      title: def.message,
      status: def.status,
      code,
      ...(detail ? { detail } : {}),
      ...(req.id ? { requestId: String(req.id) } : {}),
      ...extra,
    };
    if (code === 'RATE_LIMITED') res.setHeader('Retry-After', '60');
    res.status(def.status).type('application/problem+json').json(body);
  }
}
