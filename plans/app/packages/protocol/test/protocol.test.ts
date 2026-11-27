import { describe, expect, it } from 'vitest';
import vectors from '../vectors/vectors.json' with { type: 'json' };
import { createChannel, decodePairingCode, deriveRaw, newSecret, toHex, type Inner } from '../src/index.ts';

const secret = decodePairingCode(vectors.code);
const hello: Inner = { sender: 'front-sender-1', session: '', seq: 1, msg: { type: 'front.hello', nonce: 'nonce-1234' } };

describe('vetores compartilhados com o client', () => {
  it('deriva sala e chaves', async () => {
    const raw = await deriveRaw(secret);
    expect(raw.room).toBe(vectors.room);
    expect(toHex(raw.toClient)).toBe(vectors.toClient);
    expect(toHex(raw.toFront)).toBe(vectors.toFront);
  });

  it('abre as mensagens gravadas', async () => {
    for (const m of vectors.messages) {
      const reader = await createChannel(secret, m.from === 'front' ? 'client' : 'front');
      const inner = await reader.open({ type: 'relay', iv: m.iv, body: m.body });
      expect(inner).toEqual(JSON.parse(m.plaintext));
    }
  });
});

describe('canal cifrado', () => {
  it('vai e volta; recusa chave errada, adulteração e eco no mesmo sentido', async () => {
    const front = await createChannel(secret, 'front');
    const client = await createChannel(secret, 'client');
    const relay = await front.seal(hello);
    expect(await client.open(relay)).toEqual(hello);
    expect(await front.open(relay)).toBeNull();
    expect(await (await createChannel(newSecret(), 'client')).open(relay)).toBeNull();
    const body = (relay.body[0] === 'A' ? 'B' : 'A') + relay.body.slice(1);
    expect(await client.open({ ...relay, body })).toBeNull();
  });

  it('recusa conteúdo fora do contrato, mesmo autêntico', async () => {
    const front = await createChannel(secret, 'front');
    const client = await createChannel(secret, 'client');
    const relay = await front.seal({ ...hello, msg: { type: 'exec.start', runId: 'nao-e-uuid' } } as Inner);
    expect(await client.open(relay)).toBeNull();
  });

  it('recusa código de pareamento malformado', () => {
    expect(() => decodePairingCode('abc')).toThrow();
    expect(() => decodePairingCode('plans1_abc')).toThrow();
  });
});
