// Processo separado de envio (12-Factor: web e worker escalam independente).
import { createSmtpMailSender } from './modules/sending/mail-sender.ts';
import { createSendQueue } from './modules/sending/queue.ts';
import { createSendWorker } from './modules/sending/worker.ts';
import { loadConfig } from './shared/config.ts';
import { createPool } from './shared/db.ts';
import { createLogger } from './shared/logger.ts';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const db = createPool(config.DATABASE_URL);
const sender = createSmtpMailSender({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  tlsRejectUnauthorized: config.SMTP_TLS_REJECT_UNAUTHORIZED,
});

const worker = createSendWorker(createSendQueue(db), sender, logger, {
  from: config.MAIL_FROM,
  publicBaseUrl: config.PUBLIC_BASE_URL,
  ratePerSecond: config.SEND_RATE_PER_SECOND,
  maxAttempts: config.SEND_MAX_ATTEMPTS,
});

const controller = new AbortController();
process.on('SIGTERM', () => controller.abort());
process.on('SIGINT', () => controller.abort());

await worker.run(controller.signal);
await sender.close();
await db.end();
