// Cifra ponta a ponta: da chave de pareamento saem o id da sala e uma chave por sentido (HKDF-SHA-256);
// as mensagens vão em AES-256-GCM, com sala e sentido como dados autenticados.
import { innerSchema, type Inner, type Relay, type Role } from './messages.ts';

export const SECRET_BYTES = 32;
export const CODE_PREFIX = 'plans1_';
const SALT = 'plans/v1';

const enc = new TextEncoder();
const dec = new TextDecoder();
type Bytes = Uint8Array<ArrayBuffer>;
const utf8 = (s: string): Bytes => new Uint8Array(enc.encode(s));

export function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Bytes {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

export const randomToken = (bytes = 16) => toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
export const newSecret = (): Bytes => crypto.getRandomValues(new Uint8Array(SECRET_BYTES));
export const encodePairingCode = (secret: Uint8Array) => CODE_PREFIX + toBase64Url(secret);

export function decodePairingCode(code: string): Bytes {
  if (!code.startsWith(CODE_PREFIX)) throw new Error('Código de pareamento inválido.');
  const secret = fromBase64Url(code.slice(CODE_PREFIX.length));
  if (secret.length !== SECRET_BYTES) throw new Error('Código de pareamento inválido.');
  return secret;
}

async function hkdf(secret: Bytes, info: string, length: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: utf8(SALT), info: utf8(info) },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

export type RawKeys = { room: string; toClient: Bytes; toFront: Bytes };

export async function deriveRaw(secret: Bytes): Promise<RawKeys> {
  const [room, toClient, toFront] = await Promise.all([
    hkdf(secret, 'room', 16),
    hkdf(secret, 'front->client', 32),
    hkdf(secret, 'client->front', 32),
  ]);
  return { room: toHex(room), toClient, toFront };
}

export type Channel = {
  room: string;
  seal(inner: Inner, iv?: Bytes): Promise<Relay>;
  /** null quando a mensagem não é autêntica ou não segue o contrato. */
  open(relay: Relay): Promise<Inner | null>;
};

/** Canal de um dos lados: cifra no seu sentido e só abre o que veio no sentido oposto. */
export async function createChannel(secret: Bytes, side: Role): Promise<Channel> {
  const raw = await deriveRaw(secret);
  const aes = (k: Bytes) => crypto.subtle.importKey('raw', k, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const [toClient, toFront] = await Promise.all([aes(raw.toClient), aes(raw.toFront)]);
  const out = side === 'front' ? { key: toClient, dir: 'front->client' } : { key: toFront, dir: 'client->front' };
  const incoming = side === 'front' ? { key: toFront, dir: 'client->front' } : { key: toClient, dir: 'front->client' };
  const aad = (dir: string) => utf8(`${raw.room}|${dir}`);

  return {
    room: raw.room,
    async seal(inner, iv = crypto.getRandomValues(new Uint8Array(12))) {
      const body = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: aad(out.dir) },
        out.key,
        utf8(JSON.stringify(inner)),
      );
      return { type: 'relay', iv: toBase64Url(iv), body: toBase64Url(new Uint8Array(body)) };
    },
    async open(relay) {
      try {
        const plain = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: fromBase64Url(relay.iv), additionalData: aad(incoming.dir) },
          incoming.key,
          fromBase64Url(relay.body),
        );
        return innerSchema.parse(JSON.parse(dec.decode(plain)));
      } catch {
        return null;
      }
    },
  };
}
