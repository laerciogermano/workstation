import { buildApp } from './app';
import { systemClock } from './shared/clock';
import { createPool } from './shared/db';
import { loadEnv } from './shared/env';

const env = loadEnv();
const db = createPool(env.DATABASE_URL);
const app = await buildApp({
  db,
  clock: systemClock,
  logLevel: env.LOG_LEVEL,
  corsOrigins: env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  pretty: env.NODE_ENV === 'development',
});

/** Descartabilidade (Twelve-Factor IX): SIGTERM fecha HTTP e pool antes de sair. */
let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'encerrando');
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  await app.close();
  await db.end();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ port: env.PORT, host: env.HOST });
