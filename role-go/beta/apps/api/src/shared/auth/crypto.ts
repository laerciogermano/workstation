import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const sha256 = (v: string): Buffer => createHash('sha256').update(v).digest();
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

/** AES-256-GCM com a KEK (JWT_KEK) para as chaves privadas em jwt_keys. */
export function seal(plain: string, kekB64: string): string {
  const key = Buffer.from(kekB64, 'base64');
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}
export function open(sealed: string, kekB64: string): string {
  const [iv, tag, enc] = sealed.split('.').map((p) => Buffer.from(p, 'base64url'));
  if (!iv || !tag || !enc) throw new Error('sealed value malformed');
  const d = createDecipheriv('aes-256-gcm', Buffer.from(kekB64, 'base64'), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
