import type { Logger } from '../../shared/logger.ts';
import { buildMessage } from './build-message.ts';
import { PermanentSendError, type MailSender } from './mail-sender.ts';
import type { SendQueue } from './queue.ts';

export type WorkerOptions = {
  from: string;
  publicBaseUrl: string;
  ratePerSecond: number;
  maxAttempts: number;
  idleMs?: number;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });

export function createSendWorker(queue: SendQueue, sender: MailSender, log: Logger, opts: WorkerOptions) {
  const batchSize = Math.max(1, Math.ceil(opts.ratePerSecond));
  const minIntervalMs = 1000 / opts.ratePerSecond;

  /** Processa um lote. Retorna quantas entregas foram tentadas. */
  async function tick(): Promise<number> {
    await queue.releaseStale();
    const batch = await queue.claim(batchSize);
    for (const d of batch) {
      const startedAt = Date.now();
      try {
        // pode ter descadastrado depois do disparo
        if (await queue.isSuppressed(d.email)) {
          await queue.markSkipped(d.id, 'Descadastrado antes do envio');
          continue;
        }
        await sender.send(buildMessage(d, opts));
        await queue.markSent(d.id);
      } catch (err) {
        const outcome = await queue.markFailed(d.id, (err as Error).message ?? String(err), {
          attempts: d.attempts,
          maxAttempts: opts.maxAttempts,
          permanent: err instanceof PermanentSendError,
        });
        log.warn({ deliveryId: d.publicId, attempts: d.attempts, outcome, err }, 'falha no envio');
      }
      // limite de envios por segundo
      const elapsed = Date.now() - startedAt;
      if (elapsed < minIntervalMs) await sleep(minIntervalMs - elapsed);
    }
    const finished = await queue.finishCampaigns();
    if (batch.length || finished) log.info({ processed: batch.length, campaignsFinished: finished }, 'lote enviado');
    return batch.length;
  }

  /** Loop até o signal abortar; termina o lote atual antes de sair (graceful shutdown). */
  async function run(signal: AbortSignal): Promise<void> {
    log.info({ ratePerSecond: opts.ratePerSecond }, 'worker de envio iniciado');
    while (!signal.aborted) {
      try {
        const processed = await tick();
        if (!processed) await sleep(opts.idleMs ?? 1000, signal);
      } catch (err) {
        log.error({ err }, 'erro no loop do worker');
        await sleep(5000, signal);
      }
    }
    log.info('worker de envio parado');
  }

  return { tick, run };
}
