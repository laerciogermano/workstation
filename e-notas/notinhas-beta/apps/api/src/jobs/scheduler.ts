import type { Deps } from '../shared/deps.js';
import { retryFailure } from '../modules/receipts/ingest-receipt.js';

/**
 * Jobs em processo (ADR-0003): geocodificação, nova tentativa de notas com falha na SEFAZ e
 * detecção de preço fora da curva. Idempotentes, um por vez, com parada limpa no SIGTERM.
 * Quando houver mais de uma instância da API, mover para worker + fila (BullMQ) com outbox.
 */
export function startScheduler(deps: Deps): { stop: () => Promise<void> } {
  let stopped = false;
  let running: Promise<void> = Promise.resolve();

  const tick = (name: string, fn: () => Promise<void>, everyMs: number) => {
    const t = setInterval(() => {
      if (stopped) return;
      running = running
        .then(fn)
        .catch((err: unknown) => deps.log.error({ err, job: name }, 'job falhou'));
    }, everyMs);
    t.unref();
    return t;
  };

  const timers = [
    tick('geocode', () => geocodePending(deps), 60_000),
    tick('retry-ingest', () => retryDueFailures(deps), 5 * 60_000),
    tick('price-outliers', () => flagPriceOutliers(deps), 15 * 60_000),
  ];

  return {
    async stop() {
      stopped = true;
      timers.forEach(clearInterval);
      await running;
    },
  };
}

/** "R. IZABEL A REDENTORA, 1434, , CENTRO, SAO JOSE DOS PINHAIS, PR" → consulta limpa (sem ", 0," nem vazios). */
export function normalizeAddressForGeocode(address: string): string {
  return address
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && p !== '0' && !/^s\/?n$/i.test(p))
    .join(', ')
    .concat(', Brasil');
}

/** ADR-010: Nominatim com cache no banco (nunca reconsulta loja geocodificada) e 1 req/s. */
async function geocodePending(deps: Deps): Promise<void> {
  if (!deps.env.GEOCODE_ENABLED) return;
  const { rows } = await deps.db.query<{ id: number; address: string | null }>(
    `SELECT id, address FROM stores WHERE geocode_status = 'pending' ORDER BY id LIMIT 5`,
  );
  for (const s of rows) {
    if (!s.address) {
      await deps.db.query(`UPDATE stores SET geocode_status = 'not_found' WHERE id = $1`, [s.id]);
      continue;
    }
    const url = new URL('/search', deps.env.NOMINATIM_URL);
    url.search = new URLSearchParams({ q: normalizeAddressForGeocode(s.address), format: 'jsonv2', limit: '1', countrycodes: 'br' }).toString();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': deps.env.NOMINATIM_USER_AGENT }, signal: AbortSignal.timeout(8000) });
      const hits = res.ok ? ((await res.json()) as { lat: string; lon: string }[]) : [];
      const hit = hits[0];
      await deps.db.query(
        hit
          ? `UPDATE stores SET lat = $2, lng = $3, geocode_status = 'ok', geocoded_at = now() WHERE id = $1`
          : `UPDATE stores SET geocode_status = 'not_found', geocoded_at = now() WHERE id = $1`,
        hit ? [s.id, Number(hit.lat), Number(hit.lon)] : [s.id],
      );
      if (hit) deps.index.invalidate();
    } catch (err) {
      deps.log.warn({ err, storeId: s.id }, 'geocode: falha temporária');
    }
    await new Promise((r) => setTimeout(r, 1100)); // política de uso: ≤ 1 req/s
  }
}

async function retryDueFailures(deps: Deps): Promise<void> {
  const { rows } = await deps.db.query<{ id: number }>(
    `SELECT id FROM ingest_failures WHERE status = 'pending' AND next_retry_at <= now() ORDER BY next_retry_at LIMIT 5`,
  );
  for (const f of rows) {
    const out = await retryFailure(deps, f.id);
    if (out.ok) deps.index.invalidate();
  }
}

/** Preço ≥ 3× a mediana do EAN (ex.: fardo registrado como unidade) vira pendência de moderação. */
async function flagPriceOutliers(deps: Deps): Promise<void> {
  await deps.db.query(
    `WITH med AS (
       SELECT gtin, percentile_cont(0.5) WITHIN GROUP (ORDER BY price_cents) AS m, count(*) AS n
       FROM v_price_observations WHERE observed_at > now() - interval '60 days' GROUP BY gtin HAVING count(*) >= 3
     )
     INSERT INTO moderation_flags (kind, store_id, store_code, item_id, proposed_gtin, summary)
     SELECT 'price_outlier', ri.store_id, ri.store_code, ri.id, o.gtin,
            ri.description || ' R$ ' || to_char(ri.unit_price_cents / 100.0, 'FM999990D00') || ' (mediana R$ ' || to_char(med.m / 100.0, 'FM999990D00') || ')'
     FROM v_price_observations o
     JOIN med ON med.gtin = o.gtin
     JOIN receipt_items ri ON ri.id = o.item_id
     WHERE o.price_cents >= 3 * med.m
       AND NOT EXISTS (SELECT 1 FROM moderation_flags f WHERE f.item_id = ri.id AND f.kind = 'price_outlier')
     ON CONFLICT DO NOTHING`,
  );
}
