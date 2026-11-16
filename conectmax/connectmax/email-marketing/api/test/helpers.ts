import pg from 'pg';
import { migrate } from '../src/db/migrate.ts';
import { loadConfig, type Config } from '../src/shared/config.ts';
import { createPool, type Db } from '../src/shared/db.ts';
import { createLogger } from '../src/shared/logger.ts';
import type { MailSender, OutgoingMail } from '../src/modules/sending/mail-sender.ts';

const BASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://email_marketing:email_marketing@localhost:5434/email_marketing';
const TEST_DB = 'email_marketing_test';

export async function setupTestDb(): Promise<{ db: Db; config: Config }> {
  const admin = new pg.Client({ connectionString: BASE_URL });
  await admin.connect();
  const { rowCount } = await admin.query('select 1 from pg_database where datname = $1', [TEST_DB]);
  if (!rowCount) await admin.query(`create database ${TEST_DB}`);
  await admin.end();

  const url = new URL(BASE_URL);
  url.pathname = `/${TEST_DB}`;
  await migrate(url.toString());

  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: url.toString(),
    PUBLIC_BASE_URL: 'http://localhost:4000',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_TLS_REJECT_UNAUTHORIZED: 'true',
    MAIL_FROM: 'Connect <marketing@connect.local>',
    LOG_LEVEL: 'silent',
  });
  return { db: createPool(config.DATABASE_URL), config };
}

export async function resetDb(db: Db): Promise<void> {
  await db.query(
    'truncate deliveries, campaigns, contacts, lists, suppressions, sessions, operators restart identity cascade',
  );
}

export const silentLogger = createLogger('silent');

export function fakeSender(): MailSender & { sent: OutgoingMail[]; failNext: (err: Error, times?: number) => void } {
  const sent: OutgoingMail[] = [];
  let failures: Error[] = [];
  return {
    sent,
    failNext(err, times = 1) {
      failures = Array.from({ length: times }, () => err);
    },
    async send(mail) {
      const err = failures.shift();
      if (err) throw err;
      sent.push(mail);
    },
    async close() {},
  };
}
