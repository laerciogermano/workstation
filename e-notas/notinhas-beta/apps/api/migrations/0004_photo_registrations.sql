-- Votos de foto por EAN (espelho de barcode_registrations).
-- products.photo_url = URL mais votada; empate = voto mais recente.
CREATE TABLE photo_registrations (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gtin                 text NOT NULL REFERENCES products (gtin) ON DELETE CASCADE,
  photo_url            text NOT NULL,
  source               text,
  linked_by_visitor_id bigint REFERENCES visitors (id) ON DELETE SET NULL,
  linked_by_user_id    bigint REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photo_registrations_gtin_idx ON photo_registrations (gtin);
CREATE INDEX photo_registrations_url_idx ON photo_registrations (gtin, photo_url);
CREATE INDEX photo_registrations_visitor_idx ON photo_registrations (linked_by_visitor_id);
CREATE INDEX photo_registrations_user_idx ON photo_registrations (linked_by_user_id);

-- Backfill: foto atual da ficha conta como 1 voto (import).
INSERT INTO photo_registrations (gtin, photo_url, source, created_at)
SELECT gtin, photo_url, 'import', coalesce(updated_at, created_at, now())
FROM products
WHERE photo_url IS NOT NULL AND length(trim(photo_url)) > 0;
