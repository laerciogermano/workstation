import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { config } from '../config.js';

export const hashPassword = (password: string) => hash(password); // argon2id (padrão da biblioteca)
export const verifyPassword = (digest: string, password: string) => verify(digest, password).catch(() => false);
/** hash determinístico com chave do servidor, para códigos e tokens */
export const digest = (value: string) => createHmac('sha256', config.jwtSecret).update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export const otp = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export const backupCode = () => `${String(randomInt(0, 10_000)).padStart(4, '0')}-${String(randomInt(0, 10_000)).padStart(4, '0')}`;
export function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function encrypt(plain: string) {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', config.encryptionKey, iv);
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString('base64url')).join('.');
}
export function decrypt(sealed: string) {
  const [iv, tag, body] = sealed.split('.').map((p) => Buffer.from(p, 'base64url'));
  const d = createDecipheriv('aes-256-gcm', config.encryptionKey, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(body), d.final()]).toString('utf8');
}

// ---------- TOTP (RFC 6238): compatível com Google e Microsoft Authenticator ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return bits ? out + B32[(value << (5 - bits)) & 31] : out;
}
export function base32Decode(text: string) {
  let bits = 0, value = 0; const out: number[] = [];
  for (const ch of text.replace(/[\s=]/g, '').toUpperCase()) {
    value = (value << 5) | B32.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
export const newTotpSecret = () => base32Encode(randomBytes(20));
export function totp(secret: string, step: number) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}
/** devolve o passo usado (para barrar reuso) ou null */
export function totpStep(secret: string, code: string, after = 0, now = Date.now()) {
  const current = Math.floor(now / 30_000);
  for (const step of [current - 1, current, current + 1]) if (step > after && same(totp(secret, step), code)) return step;
  return null;
}
