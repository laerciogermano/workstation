/** Geocodifica endereço via Nominatim (OSM). 1 req/s — usar só no servidor. */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Limpa lixo típico da DANFE: vírgulas vazias, complemento `0`,
 * loja/sala, número de porta repetido (`1434, 1434`).
 */
export function normalizeEndereco(endereco) {
  const cleaned = String(endereco || '')
    // "LOJAS 101,102 E 103" / "SALA 2" / "LJ 01-A" (pode atravessar vírgulas)
    .replace(
      /\b(lojas?|lj|salas?|sl|apto|apartamento|bloco|bl|andar|box)\b[\s\d,Ee\/-]*/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^(0+|-+|\.+)$/.test(p))
    // resto órfão tipo "102 E 103"
    .filter((p) => !/^\d+(\s*(e|,|\/)\s*\d+)+$/i.test(p));

  const deduped = [];
  for (const p of parts) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.toLowerCase() === p.toLowerCase()) continue;
    // número isolado igual ao final do trecho anterior ("RUA X 1434", "1434")
    if (prev && /^\d+[A-Za-z]?$/.test(p)) {
      const m = prev.match(/(\d+[A-Za-z]?)\s*$/);
      if (m && m[1] === p) continue;
    }
    deduped.push(p);
  }

  return deduped.join(', ').replace(/\s+/g, ' ').trim();
}

/** Variantes mais simples quando a query completa não acha (Nominatim). */
export function geocodeQueryVariants(endereco) {
  const base = normalizeEndereco(endereco);
  if (!base) return [];
  const withBr = /brasil|brazil|\bbr\b/i.test(base) ? base : `${base}, Brasil`;
  const variants = [withBr];

  // sem trechos de complemento restantes; só logradouro + nº + cidade + UF
  const parts = base.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const slim = [parts[0], parts[1], parts[parts.length - 2], parts[parts.length - 1]]
      .filter(Boolean)
      .join(', ');
    const slimBr = /brasil|brazil|\bbr\b/i.test(slim) ? slim : `${slim}, Brasil`;
    if (!variants.includes(slimBr)) variants.push(slimBr);
  }

  // "IZABEL A REDENTORA 1434" → "Rua IZABEL A REDENTORA, 1434, …"
  const streetNum = parts[0]?.match(/^(.+?)\s+(\d+[A-Za-z]?)$/);
  if (streetNum) {
    const rest = parts.slice(1).join(', ');
    const rebuilt = `Rua ${streetNum[1]}, ${streetNum[2]}${rest ? `, ${rest}` : ''}`;
    const rebuiltBr = /brasil|brazil|\bbr\b/i.test(rebuilt)
      ? rebuilt
      : `${rebuilt}, Brasil`;
    if (!variants.includes(rebuiltBr)) variants.push(rebuiltBr);
  }

  return variants;
}

async function nominatimSearch(query) {
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

/**
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function geocodeEndereco(endereco) {
  const variants = geocodeQueryVariants(endereco);
  for (let i = 0; i < variants.length; i += 1) {
    const coords = await nominatimSearch(variants[i]);
    if (coords) return coords;
    if (i < variants.length - 1) {
      await sleep(1100);
    }
  }
  return null;
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
