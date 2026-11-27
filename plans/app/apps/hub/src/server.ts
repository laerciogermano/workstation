// Processo do hub. Configuração só por ambiente, validada na subida.
import { z } from 'zod';
import { createHub } from './hub.ts';

const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4780),
    HOST: z.string().default('127.0.0.1'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:5280,http://127.0.0.1:5280'),
    TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  })
  .parse(process.env);

const log = (event: string, data: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...data }));

const hub = createHub({
  allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  trustProxy: env.TRUST_PROXY === 'true',
  log,
});
const port = await hub.listen(env.PORT, env.HOST);
log('listening', { host: env.HOST, port });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void hub.close().then(() => process.exit(0)));
}
