import { config } from "./config";
import { logger } from "./logger";
import { createApp } from "./app";
import { migrate } from "./db/migrate";
import { pool } from "./db/pool";
import { purgeExpiredSessions } from "./modules/auth/auth.service";
import { reconcileOnBoot, stopAllTimers } from "./modules/runs/runner";

async function main(): Promise<void> {
  const applied = await migrate();
  if (applied.length) logger.info({ applied }, "migrations aplicadas");
  await reconcileOnBoot();
  await purgeExpiredSessions();
  const app = createApp();
  const server = app.listen(config.PORT, () => logger.info(`Flow.dev API em http://localhost:${config.PORT}`));
  const sweep = setInterval(() => purgeExpiredSessions().catch(() => undefined), 3_600_000);
  // graceful shutdown (12-factor IX / Express healthcheck-graceful-shutdown)
  const stop = (sig: string) => {
    logger.info({ sig }, "encerrando");
    clearInterval(sweep); stopAllTimers();
    server.close(() => { pool.end().finally(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));
}
main().catch(e => { logger.fatal({ e }, "falha ao iniciar"); process.exit(1); });
