import type { IngestResultDTO } from '@notinhas/contracts';
import { storeDisplayName } from '@notinhas/domain';
import type { Db, Queryable } from '../../shared/db.js';
import { withTx } from '../../shared/db.js';
import type { Owner } from '../../shared/http/context.js';
import { AppError } from '../../shared/http/problem.js';
import type { Logger } from '../../shared/logger.js';
import { awardPoints } from '../points/points.service.js';
import { receiptDto } from './receipts.repository.js';
import { checkSefazUrl } from './sefaz-url.js';
import { SefazError, type ParsedDanfe, type SefazPort } from './sefaz.port.js';

interface IngestDeps {
  db: Db;
  sefaz: SefazPort;
  log: Logger;
}

async function attachOwner(db: Queryable, receiptId: number, owner: Owner): Promise<void> {
  await db.query(
    owner.userId !== null
      ? `INSERT INTO receipt_owners (receipt_id, user_id) VALUES ($1, $2)
         ON CONFLICT (receipt_id, user_id) WHERE user_id IS NOT NULL DO NOTHING`
      : `INSERT INTO receipt_owners (receipt_id, visitor_id) VALUES ($1, $2)
         ON CONFLICT (receipt_id, visitor_id) WHERE user_id IS NULL DO NOTHING`,
    [receiptId, owner.userId ?? owner.visitorId],
  );
}

async function recordFailure(db: Db, url: string, accessKey: string, e: SefazError, owner: Owner | null): Promise<void> {
  // Fila do ADM (T-62): nova tentativa automática com backoff (5 min, 30 min, 3 h); lembra o dono
  await db.query(
    `INSERT INTO ingest_failures (url, access_key, error_code, error_message, next_retry_at, visitor_id, user_id)
     VALUES ($1, $2, $3, $4, now() + interval '5 minutes', $5, $6)
     ON CONFLICT (url) DO UPDATE SET attempts = ingest_failures.attempts + 1,
       visitor_id = coalesce(ingest_failures.visitor_id, EXCLUDED.visitor_id),
       user_id = coalesce(ingest_failures.user_id, EXCLUDED.user_id),
       error_code = EXCLUDED.error_code, error_message = EXCLUDED.error_message,
       status = CASE WHEN ingest_failures.attempts + 1 >= 4 THEN 'failed' ELSE 'pending' END,
       next_retry_at = now() + (interval '5 minutes' * power(6, least(ingest_failures.attempts, 3)))`,
    [url, accessKey, e.code, e.message.slice(0, 300), owner?.visitorId ?? null, owner?.userId ?? null],
  );
}

/** Persiste emitente, nota e itens numa transação curta (sem rede dentro — 08 §6). */
async function persist(db: Db, url: string, parsed: ParsedDanfe, owner: Owner | null) {
  return withTx(db, async (tx) => {
    const s = parsed.store;
    const store = await tx.query<{ id: number }>(
      `INSERT INTO stores (cnpj, legal_name, display_name, address, neighborhood, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (cnpj) DO UPDATE SET address = coalesce(stores.address, EXCLUDED.address)
       RETURNING id`,
      [s.cnpj, s.legalName, storeDisplayName(s.legalName), s.address, s.neighborhood, s.city],
    );
    const storeId = store.rows[0]?.id;
    if (!storeId) throw new Error('upsert de loja sem id');

    const r = parsed.receipt;
    const ins = await tx.query<{ id: number }>(
      `INSERT INTO receipts (access_key, store_id, url, number, series, issued_at, protocol, total_cents, discount_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (access_key) DO NOTHING RETURNING id`,
      [r.accessKey, storeId, url, r.number, r.series, r.issuedAt, r.protocol, r.totalCents, r.discountCents],
    );
    let receiptId = ins.rows[0]?.id;
    const created = receiptId !== undefined;
    if (!receiptId) {
      // corrida: outra requisição gravou a mesma chave entre o check e o insert
      const ex = await tx.query<{ id: number }>('SELECT id FROM receipts WHERE access_key = $1', [r.accessKey]);
      receiptId = ex.rows[0]?.id;
    } else {
      for (const it of parsed.items) {
        await tx.query(
          `INSERT INTO receipt_items (receipt_id, store_id, line_no, store_code, description, quantity, unit, unit_price_cents, total_cents)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [receiptId, storeId, it.lineNo, it.storeCode, it.description, it.quantity, it.unit, it.unitPriceCents, it.totalCents],
        );
      }
    }
    if (!receiptId) throw new Error('nota sem id após upsert');
    let points = 0;
    if (owner) {
      await attachOwner(tx, receiptId, owner);
      if (created) points = await awardPoints(tx, owner, 'receipt', `receipt:${r.accessKey}`, `NFC-e · ${storeDisplayName(s.legalName)}`);
    }
    await tx.query(`UPDATE ingest_failures SET status = 'resolved' WHERE url = $1`, [url]);
    return { receiptId, created, points };
  });
}

/** US-01.06/07/08 · RN-01, RN-03, RN-15 */
export async function ingestReceipt(deps: IngestDeps, rawUrl: string, owner: Owner | null): Promise<IngestResultDTO> {
  const check = checkSefazUrl(rawUrl);
  if (!check.ok) throw new AppError('INVALID_SEFAZ_URL', check.reason);

  // RN-03: a chave está no próprio QR — nota repetida nem vai à SEFAZ
  const existing = await deps.db.query<{ id: number }>('SELECT id FROM receipts WHERE access_key = $1', [check.accessKey]);
  const existingId = existing.rows[0]?.id;
  if (existingId) {
    if (owner) await attachOwner(deps.db, existingId, owner); // entra no histórico pessoal (REQ-051), sem pontos
    const receipt = await receiptDto(deps.db, existingId);
    if (!receipt) throw new AppError('NOT_FOUND');
    return { status: 'duplicate', pointsAwarded: 0, receipt };
  }

  let parsed: ParsedDanfe;
  try {
    parsed = await deps.sefaz.fetchReceipt(check.url);
  } catch (e) {
    if (e instanceof SefazError) {
      await recordFailure(deps.db, check.url, check.accessKey, e, owner);
      deps.log.warn({ code: e.code, msg: e.message }, 'ingestão: falha SEFAZ');
      throw new AppError(e.code);
    }
    throw e;
  }
  if (parsed.receipt.accessKey !== check.accessKey) {
    throw new AppError('SEFAZ_PARSER_ERROR', 'A chave da página não confere com a do QR Code.');
  }

  const { receiptId, created, points } = await persist(deps.db, check.url, parsed, owner);
  const receipt = await receiptDto(deps.db, receiptId);
  if (!receipt) throw new AppError('NOT_FOUND');
  return { status: created ? 'created' : 'duplicate', pointsAwarded: points, receipt };
}

/** Reprocessa falhas pendentes (agendador em main.ts e botão do ADM). Idempotente por chave. */
export async function retryFailure(deps: IngestDeps, failureId: number): Promise<{ ok: boolean; message: string }> {
  const { rows } = await deps.db.query<{ url: string; visitor_id: number | null; user_id: number | null }>(
    'SELECT url, visitor_id, user_id FROM ingest_failures WHERE id = $1',
    [failureId],
  );
  const f = rows[0];
  if (!f) throw new AppError('NOT_FOUND');
  const owner: Owner | null =
    f.user_id !== null ? { userId: f.user_id, visitorId: null } : f.visitor_id !== null ? { userId: null, visitorId: f.visitor_id } : null;
  try {
    const r = await ingestReceipt(deps, f.url, owner);
    await deps.db.query(`UPDATE ingest_failures SET status = 'resolved' WHERE id = $1`, [failureId]);
    return { ok: true, message: r.status === 'created' ? 'Nota lida e indexada.' : 'Nota já estava no índice.' };
  } catch (e) {
    return { ok: false, message: e instanceof AppError ? e.message : 'Falhou de novo.' };
  }
}
