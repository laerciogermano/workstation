import { pino } from 'pino';
import type { Env } from './env.js';

/** Pino em stdout, JSON, com redação de segredos e PII (08 §5, 10). */
export function createLogger(env: Pick<Env, 'LOG_LEVEL' | 'NODE_ENV'>) {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-client-fingerprint"]', 'res.headers["set-cookie"]', '*.password', '*.newPassword', '*.token', '*.email'],
      censor: '[redacted]',
    },
    ...(env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty', options: { singleLine: true } } } : {}),
  });
}
export type Logger = ReturnType<typeof createLogger>;
