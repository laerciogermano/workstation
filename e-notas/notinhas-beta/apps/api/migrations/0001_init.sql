-- notinhas.shop Beta — schema inicial
-- Convenções (core/definir-projeto-moderno/06-banco-postgresql): PK interna bigint identity, id público uuid,
-- dinheiro em centavos (integer), tempo em timestamptz, FKs sempre indexadas, integridade no banco.
-- O schema é definido por search_path (DB_SCHEMA); nada aqui fixa o nome.

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- ───────────── identidade ─────────────
CREATE TABLE users (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id     uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  email         citext NOT NULL CHECK (length(email) <= 254),
  password_hash text NOT NULL,
  name          text CHECK (length(name) <= 80),
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_store_opt_in boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE UNIQUE INDEX users_email_active_uq ON users (email) WHERE deleted_at IS NULL;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- REQ-050: visitante anônimo. Guardamos só o hash (com pepper) do fingerprint, nunca o valor cru.
CREATE TABLE visitors (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  fingerprint_hash bytea NOT NULL UNIQUE,
  user_id          bigint REFERENCES users (id) ON DELETE SET NULL,
  first_ip         inet,
  last_ip          inet,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  merged_at        timestamptz
);
CREATE INDEX visitors_user_idx ON visitors (user_id);

CREATE TABLE sessions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  bytea NOT NULL UNIQUE,
  family_id   uuid NOT NULL,
  user_agent  text,
  ip          inet,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  replaced_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_family_idx ON sessions (family_id);

CREATE TABLE password_resets (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX password_resets_user_idx ON password_resets (user_id);

-- ───────────── índice fiscal (público, anônimo — RN-06) ─────────────
CREATE TABLE stores (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cnpj         text NOT NULL UNIQUE CHECK (cnpj ~ '^\d{14}$'),
  legal_name   text NOT NULL,
  display_name text NOT NULL,
  address      text,
  neighborhood text,
  city         text,
  lat          double precision CHECK (lat BETWEEN -90 AND 90),
  lng          double precision CHECK (lng BETWEEN -180 AND 180),
  geocode_status text NOT NULL DEFAULT 'pending' CHECK (geocode_status IN ('pending', 'ok', 'not_found', 'manual')),
  geocoded_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stores_geocode_pending_idx ON stores (id) WHERE geocode_status = 'pending';
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE receipts (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id      uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  access_key     text NOT NULL UNIQUE CHECK (access_key ~ '^\d{44}$'),   -- RN-03
  store_id       bigint NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  url            text NOT NULL,
  number         text,
  series         text,
  issued_at      timestamptz,
  protocol       text,
  total_cents    integer CHECK (total_cents >= 0),
  discount_cents integer CHECK (discount_cents >= 0),
  is_demo        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX receipts_store_idx ON receipts (store_id);
CREATE INDEX receipts_issued_idx ON receipts (issued_at DESC);

CREATE TABLE receipt_items (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  receipt_id       bigint NOT NULL REFERENCES receipts (id) ON DELETE CASCADE,
  store_id         bigint NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  line_no          integer NOT NULL CHECK (line_no > 0),
  store_code       text NOT NULL,
  description      text NOT NULL,
  quantity         numeric(12, 3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit             text,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  total_cents      integer NOT NULL CHECK (total_cents >= 0),
  is_hidden        boolean NOT NULL DEFAULT false,                 -- moderação (US-ADM.02), nunca apaga
  hidden_reason    text,
  UNIQUE (receipt_id, line_no)                                     -- RN-04
);
CREATE INDEX receipt_items_store_code_idx ON receipt_items (store_id, store_code);
CREATE INDEX receipt_items_description_trgm_idx ON receipt_items USING gin (description gin_trgm_ops);

-- Ficha canônica do produto por EAN (REQ-047/048)
CREATE TABLE products (
  gtin        text PRIMARY KEY CHECK (gtin ~ '^(\d{8}|\d{12,14})$'),
  title       text NOT NULL,
  brand       text,
  category    text NOT NULL DEFAULT 'outros',
  subcategory text,
  ncm         text,
  photo_url   text,
  sources     text[] NOT NULL DEFAULT '{}',
  enriched_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_title_trgm_idx ON products USING gin (title gin_trgm_ops);
CREATE INDEX products_category_idx ON products (category);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Vínculo cooperativo (empresa, cód. interno) ↔ EAN (RN-12, ADR-005)
CREATE TABLE barcode_links (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id             bigint NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  store_code           text NOT NULL,
  gtin                 text NOT NULL REFERENCES products (gtin) ON DELETE RESTRICT,
  origin               text NOT NULL CHECK (origin IN ('barcode_scan', 'suggestion', 'manual', 'import')),
  linked_by_visitor_id bigint REFERENCES visitors (id) ON DELETE SET NULL,
  linked_by_user_id    bigint REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, store_code)
);
CREATE INDEX barcode_links_gtin_idx ON barcode_links (gtin);
CREATE INDEX barcode_links_visitor_idx ON barcode_links (linked_by_visitor_id);
CREATE INDEX barcode_links_user_idx ON barcode_links (linked_by_user_id);
CREATE TRIGGER barcode_links_updated_at BEFORE UPDATE ON barcode_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Observações públicas: só tabelas fiscais + vínculo; nenhuma coluna de pessoa (RN-06, ADR-008).
CREATE VIEW v_price_observations AS
SELECT ri.id AS item_id, bl.gtin, ri.store_id, ri.unit_price_cents AS price_cents,
       coalesce(r.issued_at, r.created_at) AS observed_at
FROM receipt_items ri
JOIN receipts r ON r.id = ri.receipt_id
JOIN barcode_links bl ON bl.store_id = ri.store_id AND bl.store_code = ri.store_code
WHERE NOT ri.is_hidden;

-- ───────────── dados pessoais (privados ao titular — RN-14) ─────────────
-- Posse da nota fica fora do índice: a mesma nota pode estar no histórico de várias pessoas.
CREATE TABLE receipt_owners (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  receipt_id bigint NOT NULL REFERENCES receipts (id) ON DELETE CASCADE,
  visitor_id bigint REFERENCES visitors (id) ON DELETE CASCADE,
  user_id    bigint REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (visitor_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE UNIQUE INDEX receipt_owners_user_uq ON receipt_owners (receipt_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX receipt_owners_visitor_uq ON receipt_owners (receipt_id, visitor_id) WHERE user_id IS NULL;
CREATE INDEX receipt_owners_visitor_idx ON receipt_owners (visitor_id);
CREATE INDEX receipt_owners_user_idx ON receipt_owners (user_id);

CREATE TABLE shopping_lists (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id  uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  visitor_id bigint REFERENCES visitors (id) ON DELETE CASCADE,
  user_id    bigint REFERENCES users (id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (visitor_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE INDEX shopping_lists_visitor_idx ON shopping_lists (visitor_id);
CREATE INDEX shopping_lists_user_idx ON shopping_lists (user_id);
CREATE TRIGGER shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE shopping_list_items (
  list_id    bigint NOT NULL REFERENCES shopping_lists (id) ON DELETE CASCADE,
  gtin       text NOT NULL REFERENCES products (gtin) ON DELETE CASCADE,
  quantity   integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, gtin)
);
CREATE INDEX shopping_list_items_gtin_idx ON shopping_list_items (gtin);

-- REQ-052: livro-razão de pontos (saldo = soma). Idempotente por (kind, ref).
CREATE TABLE point_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id bigint REFERENCES visitors (id) ON DELETE CASCADE,
  user_id    bigint REFERENCES users (id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('receipt', 'eanLink')),
  points     integer NOT NULL,
  ref        text NOT NULL,
  label      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref),
  CHECK (visitor_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE INDEX point_events_visitor_idx ON point_events (visitor_id);
CREATE INDEX point_events_user_idx ON point_events (user_id);

-- Consumo de crédito de cotação (gate T-54)
CREATE TABLE usage_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id bigint REFERENCES visitors (id) ON DELETE CASCADE,
  user_id    bigint REFERENCES users (id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('quote')),
  ref        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usage_events_visitor_idx ON usage_events (visitor_id, created_at);
CREATE INDEX usage_events_user_idx ON usage_events (user_id, created_at);

-- ───────────── backoffice ─────────────
CREATE TABLE ingest_failures (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url           text NOT NULL UNIQUE,
  access_key    text,
  error_code    text NOT NULL,
  error_message text,
  attempts      integer NOT NULL DEFAULT 1,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'failed')),
  next_retry_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ingest_failures_status_idx ON ingest_failures (status, next_retry_at);
CREATE TRIGGER ingest_failures_updated_at BEFORE UPDATE ON ingest_failures FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE moderation_flags (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('ean_divergent', 'price_outlier')),
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  store_id    bigint REFERENCES stores (id) ON DELETE CASCADE,
  store_code  text,
  item_id     bigint REFERENCES receipt_items (id) ON DELETE CASCADE,
  current_gtin  text,
  proposed_gtin text,
  summary     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX moderation_flags_status_idx ON moderation_flags (status);
CREATE INDEX moderation_flags_store_idx ON moderation_flags (store_id);
CREATE INDEX moderation_flags_item_idx ON moderation_flags (item_id);
CREATE UNIQUE INDEX moderation_flags_open_uq ON moderation_flags (kind, store_id, store_code, proposed_gtin) WHERE status = 'open';

CREATE TABLE audit_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint REFERENCES users (id) ON DELETE SET NULL,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text NOT NULL,
  payload    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity, entity_id);
CREATE INDEX audit_log_user_idx ON audit_log (user_id);
