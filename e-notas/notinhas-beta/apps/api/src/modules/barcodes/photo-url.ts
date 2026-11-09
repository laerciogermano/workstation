/** https público — candidatas Google Imagens vêm de CDNs arbitrários. */

function isPrivateHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '::1' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '0.0.0.0') return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

export function isPublicHttpsUrl(url: string | URL): boolean {
  try {
    const u = typeof url === 'string' ? new URL(url) : url;
    if (u.protocol !== 'https:') return false;
    if (!u.hostname || isPrivateHostname(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isAllowedPhotoUrl(url: string): boolean {
  if (url.startsWith('/media/')) return true;
  return isPublicHttpsUrl(url);
}
