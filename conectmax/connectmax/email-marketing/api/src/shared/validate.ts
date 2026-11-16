import type { z } from 'zod';
import { AppError } from './errors.ts';

// Validação allowlist na borda: TS não valida nada em runtime.
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw new AppError(400, 'invalid_input', 'Dados inválidos.', details);
  }
  return result.data;
}
