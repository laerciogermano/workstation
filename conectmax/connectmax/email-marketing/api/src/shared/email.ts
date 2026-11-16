import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'E-mail inválido' }).max(320));

export function normalizeEmail(raw: string): string | null {
  const r = emailSchema.safeParse(raw);
  return r.success ? r.data : null;
}
