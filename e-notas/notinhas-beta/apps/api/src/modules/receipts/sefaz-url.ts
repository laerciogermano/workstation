import { isValidAccessKey, normalizeAccessKey } from '@notinhas/domain';

/** RN-01 + anti-SSRF: só consulta pública NFC-e da Fazenda PR, por allow-list de host. */
const ALLOWED_HOST = /(^|\.)fazenda\.pr\.gov\.br$/i;

export type SefazUrlCheck =
  | { ok: true; url: string; accessKey: string }
  | { ok: false; reason: string };

export function checkSefazUrl(raw: string): SefazUrlCheck {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { ok: false, reason: 'Não é um link.' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, reason: 'Protocolo não suportado.' };
  if (!ALLOWED_HOST.test(u.hostname)) return { ok: false, reason: 'O link não é da Fazenda do Paraná.' };
  if (u.port && u.port !== '443' && u.port !== '80') return { ok: false, reason: 'Porta não permitida.' };
  if (!/\/nfce\/qrcode\/?$/i.test(u.pathname)) return { ok: false, reason: 'O link não é de consulta de NFC-e.' };
  const p = u.searchParams.get('p');
  if (!p) return { ok: false, reason: 'O link não tem o parâmetro do QR Code.' };
  // QR v2: p = chave|versão|ambiente|...|hash → a chave vem antes do primeiro "|"
  const key = normalizeAccessKey(p.split('|')[0]);
  if (!key || !isValidAccessKey(key)) return { ok: false, reason: 'A chave de acesso do QR Code é inválida.' };
  u.protocol = 'https:'; // sempre HTTPS na saída (RN-07)
  u.port = '';
  return { ok: true, url: u.toString(), accessKey: key };
}
