import { createApp } from './app.ts';
import { loadConfig } from './shared/config.ts';
import { createPool } from './shared/db.ts';
import { createLogger } from './shared/logger.ts';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const db = createPool(config.DATABASE_URL);
const app = createApp({ db, config, logger });

const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'API ouvindo'));

// Graceful shutdown: para de aceitar conexões, termina as em andamento, fecha o pool.
let closing = false;
function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  logger.info({ signal }, 'encerrando API');
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
