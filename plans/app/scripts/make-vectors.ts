// Gera os vetores que TypeScript e Go precisam reproduzir, e o JSON Schema das mensagens.
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { createChannel, deriveRaw, encodePairingCode, toBase64Url, toHex } from '../packages/protocol/src/crypto.ts';
import { innerSchema, type Inner } from '../packages/protocol/src/messages.ts';

const secret = new Uint8Array(Array.from({ length: 32 }, (_, i) => i));
const raw = await deriveRaw(secret);
const iv = new Uint8Array(Array.from({ length: 12 }, (_, i) => 100 + i));
const runId = '7c1f0c9e-4b7a-4a1e-9a41-2f6c0d1b8e22';

const samples: { from: 'front' | 'client'; inner: Inner }[] = [
  { from: 'front', inner: { sender: 'front-sender-1', session: 'sessao-1', seq: 1, msg: { type: 'exec.start', runId, program: 'echo', args: ['olá <&> mundo', '"aspas"'], cwd: '' } } },
  { from: 'client', inner: { sender: 'client-sender-1', session: 'sessao-1', seq: 2, msg: { type: 'exec.output', runId, n: 0, stream: 'stdout', data: 'saída ✓\n' } } },
];

const messages = [];
for (const s of samples) {
  const relay = await (await createChannel(secret, s.from)).seal(s.inner, iv);
  messages.push({ from: s.from, plaintext: JSON.stringify(s.inner), iv: relay.iv, body: relay.body });
}

writeFileSync(
  new URL('../packages/protocol/vectors/vectors.json', import.meta.url),
  JSON.stringify({ code: encodePairingCode(secret), secret: toBase64Url(secret), room: raw.room, toClient: toHex(raw.toClient), toFront: toHex(raw.toFront), messages }, null, 2) + '\n',
);
writeFileSync(
  new URL('../packages/protocol/schema/inner.schema.json', import.meta.url),
  JSON.stringify(z.toJSONSchema(innerSchema), null, 2) + '\n',
);
