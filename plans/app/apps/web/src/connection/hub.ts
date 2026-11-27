// Conexão do front com o hub: sala, cifra, sessão do client e reconexão.
import { createChannel, fromHubSchema, randomToken, type Channel, type Message, type MessageOf } from '@plans/protocol';

export type ClientInfo = MessageOf<'hello'>;
export type LinkState =
  | { state: 'unpaired' }
  | { state: 'connecting' }
  | { state: 'hub-offline' }
  | { state: 'hub-refused'; code: string }
  | { state: 'waiting-client' }
  | { state: 'wrong-project'; info: ClientInfo }
  | { state: 'ready'; info: ClientInfo };

export type HubLinkOptions = {
  url: string;
  secret: Uint8Array<ArrayBuffer>;
  projectId: string;
  onState: (s: LinkState) => void;
  onMessage: (m: Message) => void;
  createSocket?: (url: string) => WebSocket;
};

export function createHubLink({ url, secret, projectId, onState, onMessage, createSocket = (u) => new WebSocket(u) }: HubLinkOptions) {
  const sender = randomToken();
  let ws: WebSocket | null = null;
  let channel: Channel | null = null;
  let stopped = false;
  let delay = 1000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;
  let session = '';
  let nonce = '';
  let lastIn = 0;
  let current: LinkState = { state: 'connecting' };
  // cifrar é assíncrono: as filas mantêm a ordem (o client exige sequência crescente)
  let outbox: Promise<unknown> = Promise.resolve();
  let inbox: Promise<unknown> = Promise.resolve();

  const set = (s: LinkState) => {
    current = s;
    if (!stopped) onState(s);
  };

  function seal(msg: Message, to: WebSocket) {
    outbox = outbox.then(async () => {
      if (to !== ws || to.readyState !== 1 || !channel) return;
      const relay = await channel.seal({ sender, session: msg.type === 'front.hello' ? '' : session, seq: ++seq, msg });
      to.send(JSON.stringify(relay));
    });
  }

  async function receive(raw: string, from: WebSocket) {
    if (from !== ws || !channel) return;
    const parsed = fromHubSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return;
    const frame = parsed.data;
    if (frame.type === 'joined') {
      delay = 1000;
      set({ state: 'waiting-client' });
    } else if (frame.type === 'error') {
      set({ state: 'hub-refused', code: frame.code });
    } else if (frame.type === 'peer') {
      if (frame.role !== 'client') return;
      session = '';
      set({ state: 'waiting-client' });
      if (frame.online) {
        nonce = randomToken();
        seal({ type: 'front.hello', nonce }, from);
      }
    } else {
      const inner = await channel.open(frame);
      if (!inner) return;
      const { msg } = inner;
      if (msg.type === 'hello') {
        // só aceita o hello que responde ao nosso: um hello antigo repetido é ignorado
        if (msg.nonce !== nonce) {
          if (inner.session === session) lastIn = Math.max(lastIn, inner.seq);
          return;
        }
        nonce = '';
        session = inner.session;
        lastIn = inner.seq;
        set({ state: msg.projectId === projectId ? 'ready' : 'wrong-project', info: msg });
        return;
      }
      if (!session || inner.session !== session || inner.seq <= lastIn) return;
      lastIn = inner.seq;
      if (current.state === 'ready') onMessage(msg);
    }
  }

  function connect() {
    if (stopped) return;
    set({ state: 'connecting' });
    const socket = createSocket(url);
    ws = socket;
    let refused = false;
    socket.onopen = async () => {
      channel ??= await createChannel(secret, 'front');
      if (socket === ws && socket.readyState === 1) socket.send(JSON.stringify({ type: 'join', protocol: 1, room: channel.room, role: 'front' }));
    };
    socket.onmessage = (e) => {
      inbox = inbox.then(() => receive(String(e.data), socket)).catch((err) => console.error('mensagem descartada', err));
      refused ||= String(e.data).includes('"type":"error"');
    };
    socket.onclose = () => {
      if (socket !== ws || stopped) return;
      session = '';
      if (!refused) set({ state: 'hub-offline' });
      timer = setTimeout(connect, delay);
      delay = Math.min(delay * 2, 15_000);
    };
  }

  connect();
  return {
    /** false quando não há client pronto. */
    send(msg: Message): boolean {
      if (current.state !== 'ready' || !ws) return false;
      seal(msg, ws);
      return true;
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      ws?.close();
      ws = null;
    },
  };
}
export type HubLink = ReturnType<typeof createHubLink>;
