/**
 * Identidade do aparelho (RF-02, ADR-0003). Sem fingerprinting invasivo: um ID aleatório gerado
 * na primeira abertura fica no aparelho e rotula o token opaco emitido pela API.
 */
const TOKEN = 'ft-token';
const FP = 'ft-fp';

function read(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function write(k: string, v: string | null): void {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* sem storage: sessão efêmera */
  }
}

export const getToken = (): string | null => read(TOKEN);
export const setToken = (t: string | null): void => write(TOKEN, t);

export function getFingerprint(): string {
  let fp = read(FP);
  if (!fp) {
    fp = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    write(FP, fp);
  }
  return fp;
}
export const resetFingerprint = (): void => write(FP, null);

/** fp_7c3b·e41d·a91e */
export const fingerprintLabel = (fp = getFingerprint()): string =>
  `fp_${fp.slice(0, 4)}·${fp.slice(4, 8)}·${fp.slice(8, 12)}`;
