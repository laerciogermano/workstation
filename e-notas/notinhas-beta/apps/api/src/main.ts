import { createApp } from './app.js';
import { startScheduler } from './jobs/scheduler.js';
import { createOpenFoodFactsAdapter } from './modules/barcodes/product-lookup.port.js';
import { createPriceIndex } from './modules/catalog/price-index.js';
import { createTokenService } from './modules/identity/tokens.js';
import { createSefazPrAdapter } from './modules/receipts/sefaz-pr.adapter.js';
import { systemClock } from './shared/clock.js';
import { createPool } from './shared/db.js';
import type { Deps } from './shared/deps.js';
import { loadEnv } from './shared/env.js';
import { createLogger } from './shared/logger.js';
import { createMailer } from './shared/mail/mailer.js';
import { migrate } from './scripts/migrate.js';

const env = loadEnv();
const log = createLogger(env);
const db = createPool(env.DATABASE_URL, env.DB_SCHEMA);

await migrate(env, log);

const deps: Deps = {
  env,
  db,
  log,
  clock: systemClock,
  tokens: createTokenService(env.JWT_SECRET),
  mailer: createMailer(env.SMTP_URL, env.MAIL_FROM, log, env.NODE_ENV === 'production'),
  sefaz: createSefazPrAdapter({ timeoutMs: env.SEFAZ_TIMEOUT_MS }),
  productLookup: createOpenFoodFactsAdapter(),
  index: createPriceIndex(db, systemClock),
};

const server = createApp(deps).listen(env.PORT, env.HOST, () => {
  log.info({ port: env.PORT, schema: env.DB_SCHEMA }, 'notinhas api no ar');
});
const scheduler = env.NODE_ENV === 'test' ? null : startScheduler(deps);

// 12-Factor IX: descarte rápido e limpo
let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  log.info({ signal }, 'encerrando');
  const force = setTimeout(() => process.exit(1), 10_000).unref();
  server.close();
  await scheduler?.stop();
  await db.end();
  clearTimeout(force);
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (err) => log.error({ err }, 'unhandledRejection'));
