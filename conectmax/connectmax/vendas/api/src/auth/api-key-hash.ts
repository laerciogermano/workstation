import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/** SHA-256 hex da API key (nunca persistir plain). */
export function hashApiKey(plain: string): string {
  return createHash('sha256').update(String(plain), 'utf8').digest('hex');
}

/** Gera chave opaca para o worker (mostrar uma vez). */
export function generateApiKey(): string {
  return `cmx_${randomBytes(32).toString('hex')}`;
}

export function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
