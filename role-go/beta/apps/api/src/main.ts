import 'reflect-metadata';
import { createApp, listen } from './bootstrap';
import { env } from './shared/env';
import { startWorkers } from './worker';

async function main(): Promise<void> {
  const app = await createApp();
  await listen(app);
  // em dev o worker roda no mesmo processo (WORKER_INLINE=true); em produção é um container separado
  if (env().WORKER_INLINE) await startWorkers(app);
}

void main();
