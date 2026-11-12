import { z } from 'zod';

/** Config só por variáveis de ambiente (Twelve-Factor III). Falha rápido se faltar algo. */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    console.error('Configuração inválida:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
