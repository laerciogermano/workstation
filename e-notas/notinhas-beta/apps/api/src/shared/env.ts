import { z } from 'zod';

/** 12-Factor III: config só por ambiente, validada no boot (08 §5). */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().default(4174),
  PUBLIC_URL: z.url().default('http://localhost:5188'),
  DATABASE_URL: z.string().min(1),
  DB_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('notinhas'),
  LAB_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('enotas'),
  JWT_SECRET: z.string().min(32),
  FINGERPRINT_PEPPER: z.string().min(32),
  SEFAZ_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10_000),
  SMTP_URL: z.string().optional().default(''),
  MAIL_FROM: z.string().default('notinhas.shop <nao-responda@notinhas.shop>'),
  NOMINATIM_URL: z.url().default('https://nominatim.openstreetmap.org'),
  NOMINATIM_USER_AGENT: z.string().default('notinhas.shop/1.0 (contato@notinhas.shop)'),
  GEOCODE_ENABLED: z.stringbool().default(true),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    // Sem logger ainda: mensagem objetiva e sai (nunca imprime valores).
    console.error('Configuração inválida:', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    process.exit(1);
  }
  return parsed.data;
}
