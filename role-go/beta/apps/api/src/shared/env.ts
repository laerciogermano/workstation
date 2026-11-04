import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0', '']).transform((v) => v === 'true' || v === '1');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_ISSUER: z.string().default('rolego.com.br'),
  JWT_AUDIENCE: z.string().default('rolego-api'),
  JWT_KEK: z.string().refine((v) => Buffer.from(v, 'base64').length === 32, 'JWT_KEK precisa ter 32 bytes em base64'),
  ACCESS_TTL_S: z.coerce.number().default(600),
  REFRESH_TTL_D: z.coerce.number().default(30),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: bool.default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('RoleGo <nao-responda@rolego.com.br>'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GEOCODER: z.enum(['live', 'fake']).default('live'),
  NOMINATIM_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  NOMINATIM_UA: z.string().default('RoleGo/1.0 (contato@rolego.com.br)'),
  MEDIA_DIR: z.string().default('./media'),
  WORKER_INLINE: bool.default('false'),
  LOG_LEVEL: z.string().default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;
/** A app não sobe com env inválida (docs/08 §5). */
export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Env inválida:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment');
  }
  cached = parsed.data;
  return cached;
}
export const resetEnvCache = (): void => {
  cached = null;
};
