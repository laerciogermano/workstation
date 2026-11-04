import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { AppError } from '../errors/app-error';

export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  throw new AppError('VALIDATION_FAILED', undefined, {
    errors: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
}

/** @ZBody(schema) / @ZQuery(schema): validação por schema dos contracts (docs/08 §8). */
// why: o schema vai embrulhado em { schema } porque o Nest trata qualquer objeto com `.transform` como pipe.
const BodyDec = createParamDecorator((d: { schema: z.ZodTypeAny }, ctx: ExecutionContext) =>
  parseOrThrow(d.schema, ctx.switchToHttp().getRequest<Request>().body ?? {}),
);
const QueryDec = createParamDecorator((d: { schema: z.ZodTypeAny }, ctx: ExecutionContext) =>
  parseOrThrow(d.schema, ctx.switchToHttp().getRequest<Request>().query ?? {}),
);
export const ZBody = (schema: z.ZodTypeAny): ParameterDecorator => BodyDec({ schema });
export const ZQuery = (schema: z.ZodTypeAny): ParameterDecorator => QueryDec({ schema });
