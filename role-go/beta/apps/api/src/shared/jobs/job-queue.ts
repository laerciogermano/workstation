import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { env } from '../env';

export const QUEUES = [
  'email.send',
  'event.changed.notify',
  'event.cancelled.notify',
  'review.invite',
  'account.purge',
  'maintenance.cleanup',
  'maintenance.recount',
] as const;
export type QueueName = (typeof QUEUES)[number];
export type JobOptions = { singletonKey?: string; startAfter?: number };
export type JobHandler = (data: Record<string, unknown>) => Promise<void>;

/** Port de fila. Jobs são idempotentes (singletonKey = chave de negócio). */
export abstract class JobQueue {
  abstract send(name: QueueName, data: Record<string, unknown>, opts?: JobOptions): Promise<void>;
}

@Injectable()
export class PgBossQueue extends JobQueue implements OnModuleDestroy {
  private readonly logger = new Logger('Jobs');
  private boss: PgBoss | null = null;
  private starting: Promise<PgBoss> | null = null;

  private async get(): Promise<PgBoss> {
    if (this.boss) return this.boss;
    this.starting ??= (async () => {
      const boss = new PgBoss({ connectionString: env().DATABASE_URL, schema: 'pgboss' });
      boss.on('error', (e) => this.logger.error(e));
      await boss.start();
      for (const q of QUEUES) await boss.createQueue(q);
      this.boss = boss;
      return boss;
    })();
    return this.starting;
  }

  async send(name: QueueName, data: Record<string, unknown>, opts: JobOptions = {}): Promise<void> {
    const boss = await this.get();
    await boss.send(name, data, {
      retryLimit: 5,
      retryDelay: 30,
      retryBackoff: true,
      ...(opts.singletonKey ? { singletonKey: opts.singletonKey } : {}),
      ...(opts.startAfter ? { startAfter: opts.startAfter } : {}),
    });
  }

  async work(name: QueueName, handler: JobHandler): Promise<void> {
    const boss = await this.get();
    await boss.work<Record<string, unknown>>(name, { batchSize: 5 }, async (jobs) => {
      for (const job of jobs) await handler(job.data);
    });
  }

  async schedule(name: QueueName, cron: string): Promise<void> {
    const boss = await this.get();
    await boss.schedule(name, cron, {}, { tz: 'America/Sao_Paulo' });
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss?.stop({ graceful: true, wait: false });
  }
}

/** Fila em memória para testes: registra o que foi enfileirado. */
export class InMemoryQueue extends JobQueue {
  readonly sent: { name: QueueName; data: Record<string, unknown> }[] = [];
  async send(name: QueueName, data: Record<string, unknown>): Promise<void> {
    this.sent.push({ name, data });
  }
}
