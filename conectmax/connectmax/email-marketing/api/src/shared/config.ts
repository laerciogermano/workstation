// 12-Factor: toda configuração vem do ambiente, validada na subida.
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  PUBLIC_BASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional().transform((v) => v || undefined),
  SMTP_PASS: z.string().optional().transform((v) => v || undefined),
  // Mailcow Contabo usa cert SMTP autoassinado — em prod setar false.
  SMTP_TLS_REJECT_UNAUTHORIZED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  MAIL_FROM: z.string().min(3),
  SEND_RATE_PER_SECOND: z.coerce.number().positive().default(10),
  SEND_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuração inválida — ${fields}`);
  }
  return parsed.data;
}
