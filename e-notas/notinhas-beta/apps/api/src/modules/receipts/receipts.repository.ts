import type { BarcodeOrigin, ReceiptDTO, ReceiptSummaryDTO } from '@notinhas/contracts';
import { humanizeDescription } from '@notinhas/domain';
import type { Queryable } from '../../shared/db.js';
import type { Owner } from '../../shared/http/context.js';
import { ownerSql } from '../../shared/http/context.js';

export async function receiptDto(db: Queryable, receiptId: number): Promise<ReceiptDTO | null> {
  const { rows } = await db.query<{
    public_id: string; access_key: string; number: string | null; series: string | null; issued_at: Date | null;
    total_cents: number | null; store_id: number; display_name: string; neighborhood: string | null; address: string | null;
  }>(
    `SELECT r.public_id, r.access_key, r.number, r.series, r.issued_at, r.total_cents,
            s.id AS store_id, s.display_name, s.neighborhood, s.address
     FROM receipts r JOIN stores s ON s.id = r.store_id WHERE r.id = $1`,
    [receiptId],
  );
  const r = rows[0];
  if (!r) return null;
  const items = await db.query<{
    id: number; line_no: number; store_code: string; description: string; quantity: number; unit: string | null;
    unit_price_cents: number; total_cents: number; gtin: string | null; origin: BarcodeOrigin | 'import' | null;
    photo_url: string | null; title: string | null;
  }>(
    `SELECT ri.id, ri.line_no, ri.store_code, ri.description, ri.quantity, ri.unit, ri.unit_price_cents, ri.total_cents,
            bl.gtin, bl.origin, p.photo_url, p.title
     FROM receipt_items ri
     LEFT JOIN barcode_links bl ON bl.store_id = ri.store_id AND bl.store_code = ri.store_code
     LEFT JOIN products p ON p.gtin = bl.gtin
     WHERE ri.receipt_id = $1 ORDER BY ri.line_no`,
    [receiptId],
  );
  const dtoItems = items.rows.map((i) => ({
    id: i.id,
    lineNo: i.line_no,
    storeCode: i.store_code,
    description: i.description,
    displayName: i.title ?? humanizeDescription(i.description),
    quantity: i.quantity,
    unit: i.unit,
    unitCents: i.unit_price_cents,
    totalCents: i.total_cents,
    gtin: i.gtin,
    origin: i.origin === 'import' ? 'manual' : i.origin,
    photoUrl: i.photo_url,
  }));
  return {
    id: r.public_id,
    accessKey: r.access_key,
    number: r.number,
    series: r.series,
    issuedAt: r.issued_at?.toISOString() ?? null,
    totalCents: r.total_cents,
    store: { id: r.store_id, name: r.display_name, neighborhood: r.neighborhood, address: r.address },
    items: dtoItems,
    eanProgress: { done: dtoItems.filter((i) => i.gtin).length, total: dtoItems.length },
    quote: null,
    credits: 0,
  };
}

export async function receiptIdByPublicId(db: Queryable, publicId: string, owner: Owner): Promise<number | null> {
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) return null;
  const o = ownerSql(owner, 'ro', 2);
  const { rows } = await db.query<{ id: number }>(
    `SELECT r.id FROM receipts r JOIN receipt_owners ro ON ro.receipt_id = r.id
     WHERE r.public_id = $1 AND ${o.sql} LIMIT 1`,
    [publicId, o.param],
  );
  return rows[0]?.id ?? null;
}

export async function myReceipts(db: Queryable, owner: Owner): Promise<ReceiptSummaryDTO[]> {
  const o = ownerSql(owner, 'ro', 1);
  const { rows } = await db.query<{
    public_id: string; number: string | null; issued_at: Date | null; total_cents: number | null;
    store_id: number; display_name: string; neighborhood: string | null; item_count: number; with_ean: number;
  }>(
    `SELECT r.public_id, r.number, r.issued_at, r.total_cents, s.id AS store_id, s.display_name, s.neighborhood,
            count(ri.id)::int AS item_count, count(bl.id)::int AS with_ean
     FROM receipt_owners ro
     JOIN receipts r ON r.id = ro.receipt_id
     JOIN stores s ON s.id = r.store_id
     LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
     LEFT JOIN barcode_links bl ON bl.store_id = ri.store_id AND bl.store_code = ri.store_code
     WHERE ${o.sql}
     GROUP BY r.id, s.id
     ORDER BY coalesce(r.issued_at, r.created_at) DESC
     LIMIT 200`,
    [o.param],
  );
  return rows.map((r) => ({
    id: r.public_id,
    store: { id: r.store_id, name: r.display_name, neighborhood: r.neighborhood },
    number: r.number,
    issuedAt: r.issued_at?.toISOString() ?? null,
    totalCents: r.total_cents,
    itemCount: r.item_count,
    withEan: r.with_ean,
  }));
}
