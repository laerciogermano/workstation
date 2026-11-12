import type { ZodType, ZodTypeDef } from 'zod';
import { AppError } from './errors';

/** Valida entrada na borda com Zod; erro vira 400 com os campos inválidos. */
export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new AppError(400, 'VALIDATION', 'Entrada inválida', r.error.flatten());
  return r.data;
}
