import type { z } from 'zod';
import { AppError } from './problem.js';

/** Valida entrada na borda (Zod) e devolve dado tipado ou lança VALIDATION_FAILED/INVALID_EAN. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const invalidParams = r.error.issues.map((i) => ({ name: i.path.join('.') || '(body)', reason: i.message }));
  if (invalidParams.some((p) => p.reason === 'INVALID_EAN')) throw new AppError('INVALID_EAN', undefined, invalidParams);
  throw new AppError('VALIDATION_FAILED', undefined, invalidParams);
}
