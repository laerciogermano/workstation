import 'reflect-metadata';
import { type INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotificationHandlers } from './modules/notifications';
import { PgBossQueue } from './shared/jobs/job-queue';

/** Registra os consumidores pg-boss e os crons. */
export async function startWorkers(ctx: INestApplicationContext): Promise<void> {
  const q = ctx.get(PgBossQueue);
  const h = ctx.get(NotificationHandlers);
  await q.work('email.send', (d) => h.emailSend(d));
  await q.work('event.changed.notify', (d) => h.eventChanged(d));
  await q.work('event.cancelled.notify', (d) => h.eventCancelled(d));
  await q.work('review.invite', () => h.reviewInvite());
  await q.work('account.purge', (d) => h.accountPurge(d));
  await q.work('maintenance.cleanup', () => h.cleanup());
  await q.schedule('review.invite', '*/30 * * * *');
  await q.schedule('maintenance.cleanup', '0 4 * * *');
  new Logger('Worker').log('consumidores pg-boss ativos');
}

async function main(): Promise<void> {
  const ctx = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  ctx.enableShutdownHooks();
  await startWorkers(ctx);
}

if (require.main === module) void main();
