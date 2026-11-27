import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createHub } from '../src/hub.ts';

const ORIGIN = 'http://localhost:5280';
const room = (n: number) => n.toString(16).padStart(32, '0');
const hub = createHub({ allowedOrigins: [ORIGIN], maxFronts: 2, joinTimeoutMs: 300, maxConnectionsPerIp: 50 });
let url = '';
beforeAll(async () => {
  url = `ws://127.0.0.1:${await hub.listen(0, '127.0.0.1')}/ws`;
});
afterAll(() => hub.close());

type Peer = { ws: WebSocket; next: () => Promise<any>; closed: Promise<void> };
function connect(origin?: string): Promise<Peer> {
  const ws = new WebSocket(url, origin ? { origin } : {});
  const queue: any[] = [];
  const waiting: ((v: any) => void)[] = [];
  ws.on('message', (d) => {
    const v = JSON.parse(d.toString());
    const w = waiting.shift();
    if (w) w(v);
    else queue.push(v);
  });
  const closed = new Promise<void>((r) => ws.once('close', () => r()));
  const next = () => (queue.length ? Promise.resolve(queue.shift()) : new Promise<any>((r) => waiting.push(r)));
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve({ ws, next, closed }));
    ws.once('error', reject);
  });
}
async function join(role: 'front' | 'client', r: string, origin = role === 'front' ? ORIGIN : undefined) {
  const p = await connect(origin);
  p.ws.send(JSON.stringify({ type: 'join', protocol: 1, room: r, role }));
  return p;
}
const relay = (body: string) => JSON.stringify({ type: 'relay', iv: 'AAAAAAAAAAAAAAAA', body });

describe('hub', () => {
  it('avisa a presença e repassa nos dois sentidos, sem misturar salas', async () => {
    const client = await join('client', room(1));
    expect(await client.next()).toEqual({ type: 'joined' });
    const front = await join('front', room(1));
    const other = await join('front', room(2));
    expect(await front.next()).toEqual({ type: 'joined' });
    expect(await front.next()).toEqual({ type: 'peer', role: 'client', online: true });
    expect(await client.next()).toEqual({ type: 'peer', role: 'front', online: true });
    await other.next();

    front.ws.send(relay('paraClient'));
    expect((await client.next()).body).toBe('paraClient');
    client.ws.send(relay('paraFront'));
    expect((await front.next()).body).toBe('paraFront');

    client.ws.close();
    expect(await front.next()).toEqual({ type: 'peer', role: 'client', online: false });
    other.ws.send(relay('x'));
    front.ws.close();
    other.ws.close();
  });

  it.each([
    ['front sem origem', () => join('front', room(3), undefined as unknown as string).then(async (p) => p)],
    ['front de outro site', () => join('front', room(3), 'https://mal.exemplo')],
    ['client com origem de navegador', () => join('client', room(3), ORIGIN)],
  ])('recusa %s', async (name, open) => {
    const p = name === 'front sem origem' ? await connect() : await open();
    if (name === 'front sem origem') p.ws.send(JSON.stringify({ type: 'join', protocol: 1, room: room(3), role: 'front' }));
    expect(await p.next()).toEqual({ type: 'error', code: 'origin' });
    await p.closed;
  });

  it('um client por sala e limite de abas', async () => {
    const a = await join('client', room(4));
    await a.next();
    const b = await join('client', room(4));
    expect((await b.next()).code).toBe('room_busy');
    const fronts = [await join('front', room(4)), await join('front', room(4))];
    await Promise.all(fronts.map((f) => f.next()));
    const third = await join('front', room(4));
    expect((await third.next()).code).toBe('room_full');
    [a, ...fronts].forEach((p) => p.ws.close());
  });

  it('fecha quem não entra a tempo, manda lixo ou estoura o tamanho', async () => {
    const quiet = await connect(ORIGIN);
    expect((await quiet.next()).code).toBe('join_timeout');
    const junk = await connect(ORIGIN);
    junk.ws.send('{oi');
    expect((await junk.next()).code).toBe('invalid');
    const big = await join('front', room(5));
    await big.next();
    big.ws.send(relay('A'.repeat(300 * 1024)));
    await big.closed;
  });
});
