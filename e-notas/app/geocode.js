/** Geocodifica endereço via Nominatim (OSM). 1 req/s — usar só no servidor. */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Limpa lixo típico da DANFE (vírgulas vazias, complemento `0`). */
export function normalizeEndereco(endereco) {
  return String(endereco || '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !/^(0+|-+|\.+)$/.test(p))
    .join(', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function geocodeEndereco(endereco) {
  const q = normalizeEndereco(endereco);
  if (!q) return null;

  const query = /brasil|brazil|\bbr\b/i.test(q) ? q : `${q}, Brasil`;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'e-notas/1.0 (contabo; precos-nfc-e)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}`);
  }
  const data = await res.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit?.lat || !hit?.lon) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}

/** Geocodifica em série com pausa (política Nominatim). */
export async function geocodeMany(items, { delayMs = 1100, onEach } = {}) {
  const out = [];
  for (const item of items) {
    try {
      const coords = await geocodeEndereco(item.endereco);
      out.push({ ...item, coords });
      onEach?.({ ...item, coords, ok: true });
    } catch (err) {
      out.push({ ...item, coords: null, error: err.message });
      onEach?.({ ...item, coords: null, ok: false, error: err.message });
    }
    await sleep(delayMs);
  }
  return out;
}
