// Hub: junta front e client numa sala e repassa mensagens cifradas. Não lê o conteúdo e não grava nada.
import { createServer, type IncomingMessage } from 'node:http';
import { joinSchema, MAX_MESSAGE_BYTES, relaySchema, type Role } from '@plans/protocol';
import { WebSocket, WebSocketServer } from 'ws';

export type HubOptions = {
  /** Origens aceitas para o papel front. O client não é navegador e não envia Origin. */
  allowedOrigins: string[];
  maxFronts?: number;
  maxRooms?: number;
  maxConnectionsPerIp?: number;
  messagesPerSecond?: number;
  joinTimeoutMs?: number;
  heartbeatMs?: number;
  /** Só atrás de proxy: usa X-Real-IP para o limite por IP. */
  trustProxy?: boolean;
  log?: (event: string, data?: Record<string, unknown>) => void;
};

type Room = { client: WebSocket | null; fronts: Set<WebSocket> };

export function createHub(options: HubOptions) {
  const {
    allowedOrigins, maxFronts = 5, maxRooms = 1000, maxConnectionsPerIp = 20,
    messagesPerSecond = 200, joinTimeoutMs = 5000, heartbeatMs = 30_000, trustProxy = false, log = () => {},
  } = options;

  const rooms = new Map<string, Room>();
  const perIp = new Map<string, number>();
  const alive = new WeakSet<WebSocket>();

  const server = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, rooms: rooms.size }));
    } else res.writeHead(404).end();
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES, perMessageDeflate: false });

  const ipOf = (req: IncomingMessage) =>
    (trustProxy && typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] : req.socket.remoteAddress) ?? '?';

  server.on('upgrade', (req, socket, head) => {
    const ip = ipOf(req);
    if (req.url !== '/ws' || (perIp.get(ip) ?? 0) >= maxConnectionsPerIp) {
      socket.end('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
      ws.once('close', () => {
        const n = (perIp.get(ip) ?? 1) - 1;
        if (n > 0) perIp.set(ip, n);
        else perIp.delete(ip);
      });
      handle(ws, req.headers.origin);
    });
  });

  const send = (ws: WebSocket | null | undefined, data: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(typeof data === 'string' ? data : JSON.stringify(data));
  };

  function handle(ws: WebSocket, origin: string | undefined) {
    let room: Room | null = null;
    let roomId = '';
    let role: Role = 'front';
    let tokens = messagesPerSecond * 2;
    let last = Date.now();
    const fail = (code: string) => {
      send(ws, { type: 'error', code });
      ws.close(1008, code);
    };
    const joinTimer = setTimeout(() => fail('join_timeout'), joinTimeoutMs);
    alive.add(ws);
    ws.on('pong', () => alive.add(ws));
    ws.on('error', () => ws.terminate());

    ws.on('message', (raw, isBinary) => {
      // balde de fichas por conexão
      const now = Date.now();
      tokens = Math.min(messagesPerSecond * 2, tokens + ((now - last) / 1000) * messagesPerSecond);
      last = now;
      if (--tokens < 0) return fail('rate_limited');
      if (isBinary) return fail('invalid');

      let data: unknown;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return fail('invalid');
      }

      if (!room) {
        const join = joinSchema.safeParse(data);
        if (!join.success) return fail('invalid');
        role = join.data.role;
        // navegador sempre manda Origin: front precisa de origem permitida; client não pode ter origem
        if (role === 'front' ? !origin || !allowedOrigins.includes(origin) : origin !== undefined) return fail('origin');
        let target = rooms.get(join.data.room);
        if (!target) {
          if (rooms.size >= maxRooms) return fail('busy');
          target = { client: null, fronts: new Set() };
        }
        if (role === 'client' && target.client) return fail('room_busy');
        if (role === 'front' && target.fronts.size >= maxFronts) return fail('room_full');
        clearTimeout(joinTimer);
        roomId = join.data.room;
        room = target;
        rooms.set(roomId, room);
        send(ws, { type: 'joined' });
        if (role === 'client') {
          room.client = ws;
          room.fronts.forEach((f) => send(f, { type: 'peer', role: 'client', online: true }));
          if (room.fronts.size) send(ws, { type: 'peer', role: 'front', online: true });
        } else {
          room.fronts.add(ws);
          if (room.client) send(ws, { type: 'peer', role: 'client', online: true });
          send(room.client, { type: 'peer', role: 'front', online: true });
        }
        log('join', { role });
        return;
      }

      const relay = relaySchema.safeParse(data);
      if (!relay.success) return fail('invalid');
      const out = JSON.stringify(relay.data);
      if (role === 'front') send(room.client, out);
      else room.fronts.forEach((f) => send(f, out));
    });

    ws.on('close', () => {
      clearTimeout(joinTimer);
      if (!room) return;
      if (role === 'client' && room.client === ws) {
        room.client = null;
        room.fronts.forEach((f) => send(f, { type: 'peer', role: 'client', online: false }));
      } else if (role === 'front') {
        room.fronts.delete(ws);
        if (!room.fronts.size) send(room.client, { type: 'peer', role: 'front', online: false });
      }
      if (!room.client && !room.fronts.size) rooms.delete(roomId);
    });
  }

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) {
        ws.terminate();
        continue;
      }
      alive.delete(ws);
      ws.ping();
    }
  }, heartbeatMs);

  return {
    server,
    listen: (port: number, host: string) =>
      new Promise<number>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve((server.address() as { port: number }).port);
        });
      }),
    close: () =>
      new Promise<void>((resolve) => {
        clearInterval(heartbeat);
        for (const ws of wss.clients) ws.terminate();
        server.close(() => resolve());
      }),
  };
}
