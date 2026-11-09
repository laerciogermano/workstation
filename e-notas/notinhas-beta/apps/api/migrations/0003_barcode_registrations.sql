-- Vários EAN por (loja, cód. interno): cada vínculo é um voto.
-- barcode_links continua sendo o principal (ativo); o gtin é o mais votado.
-- vocr = dígitos lidos por OCR no mesmo frame da câmera (número impresso sob as barras).
CREATE TABLE barcode_registrations (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id             bigint NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  store_code           text NOT NULL,
  gtin                 text NOT NULL REFERENCES products (gtin) ON DELETE RESTRICT,
  origin               text NOT NULL CHECK (origin IN ('barcode_scan', 'suggestion', 'manual', 'import')),
  vocr                 text,
  linked_by_visitor_id bigint REFERENCES visitors (id) ON DELETE SET NULL,
  linked_by_user_id    bigint REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX barcode_registrations_store_code_idx ON barcode_registrations (store_id, store_code);
CREATE INDEX barcode_registrations_gtin_idx ON barcode_registrations (gtin);
CREATE INDEX barcode_registrations_visitor_idx ON barcode_registrations (linked_by_visitor_id);
CREATE INDEX barcode_registrations_user_idx ON barcode_registrations (linked_by_user_id);

-- Backfill: cada vínculo antigo conta como 1 voto.
INSERT INTO barcode_registrations (store_id, store_code, gtin, origin, linked_by_visitor_id, linked_by_user_id, created_at)
SELECT store_id, store_code, gtin, origin, linked_by_visitor_id, linked_by_user_id, created_at
FROM barcode_links;
