-- Modelagem portal_franqueado (SCHEMA-REPLICA.md)
-- Idempotente. Substitui tabelas legadas em plural (orcamentos/pedidos/…).

CREATE SCHEMA IF NOT EXISTS portal_franqueado;

CREATE TABLE IF NOT EXISTS portal_franqueado.franquia (
  id INTEGER PRIMARY KEY,
  razao_social TEXT,
  cnpj TEXT,
  nome TEXT,
  synced_at TIMESTAMPTZ
);
ALTER TABLE portal_franqueado.franquia ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE portal_franqueado.franquia ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE portal_franqueado.franquia ADD COLUMN IF NOT EXISTS nome TEXT;

CREATE TABLE IF NOT EXISTS portal_franqueado.vendedor (
  id BIGSERIAL PRIMARY KEY,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  portal_id INTEGER,
  nome TEXT NOT NULL,
  UNIQUE (franquia_id, nome)
);

CREATE TABLE IF NOT EXISTS portal_franqueado.cliente (
  id BIGSERIAL PRIMARY KEY,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  cnpj TEXT,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cliente_cnpj
  ON portal_franqueado.cliente (franquia_id, cnpj)
  WHERE cnpj IS NOT NULL AND cnpj <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_cliente_nome_sem_cnpj
  ON portal_franqueado.cliente (franquia_id, nome)
  WHERE cnpj IS NULL OR cnpj = '';

CREATE TABLE IF NOT EXISTS portal_franqueado.orcamento (
  id BIGINT NOT NULL,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  vendedor_id BIGINT REFERENCES portal_franqueado.vendedor(id),
  cliente_id BIGINT REFERENCES portal_franqueado.cliente(id),
  numero INTEGER,
  data TEXT,
  status TEXT,
  cliente_nome TEXT,
  vendedor_nome TEXT,
  total DOUBLE PRECISION,
  total_texto TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (franquia_id, id)
);
CREATE INDEX IF NOT EXISTS idx_orcamento_franquia ON portal_franqueado.orcamento (franquia_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_status ON portal_franqueado.orcamento (franquia_id, status);

CREATE TABLE IF NOT EXISTS portal_franqueado.pedido (
  id BIGINT PRIMARY KEY,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  orcamento_id BIGINT,
  vendedor_id BIGINT REFERENCES portal_franqueado.vendedor(id),
  cliente_id BIGINT REFERENCES portal_franqueado.cliente(id),
  numero INTEGER,
  data TEXT,
  status TEXT,
  cliente_nome TEXT,
  vendedor_nome TEXT,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  total DOUBLE PRECISION,
  total_texto TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pedido_franquia ON portal_franqueado.pedido (franquia_id);
CREATE INDEX IF NOT EXISTS idx_pedido_status ON portal_franqueado.pedido (franquia_id, status);
CREATE INDEX IF NOT EXISTS idx_pedido_orcamento ON portal_franqueado.pedido (franquia_id, orcamento_id);

-- Migração: PK antiga era só id (colisões entre franquias). FK composta (franquia_id, orcamento_id).
DO $$
DECLARE
  pk_cols text;
BEGIN
  SELECT string_agg(a.attname, ',' ORDER BY u.ord)
  INTO pk_cols
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS u(attnum, ord) ON true
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = u.attnum
  WHERE n.nspname = 'portal_franqueado'
    AND c.relname = 'orcamento'
    AND i.indisprimary;

  IF pk_cols IS DISTINCT FROM 'franquia_id,id' THEN
    ALTER TABLE portal_franqueado.pedido
      DROP CONSTRAINT IF EXISTS pedido_orcamento_id_fkey;
    ALTER TABLE portal_franqueado.pedido
      DROP CONSTRAINT IF EXISTS pedido_orcamento_fkey;

    UPDATE portal_franqueado.pedido p
    SET orcamento_id = NULL
    WHERE p.orcamento_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM portal_franqueado.orcamento o
        WHERE o.id = p.orcamento_id
          AND o.franquia_id = p.franquia_id
      );

    ALTER TABLE portal_franqueado.orcamento DROP CONSTRAINT IF EXISTS orcamento_pkey;
    ALTER TABLE portal_franqueado.orcamento
      ADD PRIMARY KEY (franquia_id, id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedido_orcamento_fkey'
      AND conrelid = 'portal_franqueado.pedido'::regclass
  ) THEN
    UPDATE portal_franqueado.pedido p
    SET orcamento_id = NULL
    WHERE p.orcamento_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM portal_franqueado.orcamento o
        WHERE o.id = p.orcamento_id
          AND o.franquia_id = p.franquia_id
      );

    ALTER TABLE portal_franqueado.pedido
      ADD CONSTRAINT pedido_orcamento_fkey
      FOREIGN KEY (franquia_id, orcamento_id)
      REFERENCES portal_franqueado.orcamento (franquia_id, id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portal_franqueado.pedido_item (
  pedido_id BIGINT NOT NULL REFERENCES portal_franqueado.pedido(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  id_produto INTEGER,
  produto TEXT,
  ncm TEXT,
  quantidade DOUBLE PRECISION,
  valor_unitario DOUBLE PRECISION,
  lucro_percentual DOUBLE PRECISION,
  valor_extra DOUBLE PRECISION,
  total DOUBLE PRECISION,
  total_unidade DOUBLE PRECISION,
  PRIMARY KEY (pedido_id, seq)
);

CREATE TABLE IF NOT EXISTS portal_franqueado.nota_fiscal (
  id BIGINT PRIMARY KEY,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  cliente_id BIGINT REFERENCES portal_franqueado.cliente(id),
  numero INTEGER,
  status TEXT,
  tipo TEXT,
  cliente_nome TEXT,
  data TEXT,
  transportadora TEXT,
  total DOUBLE PRECISION,
  total_texto TEXT,
  pdf TEXT,
  xml_url TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nf_franquia ON portal_franqueado.nota_fiscal (franquia_id);

CREATE TABLE IF NOT EXISTS portal_franqueado.nota_fiscal_xml (
  nota_id BIGINT PRIMARY KEY REFERENCES portal_franqueado.nota_fiscal(id) ON DELETE CASCADE,
  xml TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_franqueado.conta_receber (
  id BIGINT PRIMARY KEY,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  nota_id BIGINT REFERENCES portal_franqueado.nota_fiscal(id),
  pedido_id BIGINT REFERENCES portal_franqueado.pedido(id),
  cliente_id BIGINT REFERENCES portal_franqueado.cliente(id),
  status TEXT,
  vencimento TEXT,
  titulo TEXT,
  fatura_n INTEGER,
  nf_numero INTEGER,
  cliente_nome TEXT,
  cnpj TEXT,
  descricao TEXT,
  valor DOUBLE PRECISION,
  valor_texto TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_franquia ON portal_franqueado.conta_receber (franquia_id);
CREATE INDEX IF NOT EXISTS idx_cr_status ON portal_franqueado.conta_receber (franquia_id, status);

CREATE TABLE IF NOT EXISTS portal_franqueado.faturamento_linha (
  id BIGSERIAL PRIMARY KEY,
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  vendedor_nome TEXT,
  nota TEXT,
  pedido TEXT,
  data TEXT,
  total DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_fat_linha_franquia ON portal_franqueado.faturamento_linha (franquia_id);

DROP TABLE IF EXISTS portal_franqueado.chamado;
CREATE TABLE portal_franqueado.chamado (
  id BIGSERIAL PRIMARY KEY,
  franquia_id INTEGER REFERENCES portal_franqueado.franquia(id),
  status TEXT,
  assunto TEXT,
  envolvidos TEXT,
  criado_em TEXT,
  editado_por TEXT,
  ultima_interacao TEXT,
  payload JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS portal_franqueado.notificacao;
CREATE TABLE portal_franqueado.notificacao (
  id BIGSERIAL PRIMARY KEY,
  franquia_id INTEGER REFERENCES portal_franqueado.franquia(id),
  assunto TEXT,
  enviado_por TEXT,
  data TEXT,
  payload JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- remove legado plural (dashboard passou a ler tabelas normalizadas)
DROP VIEW IF EXISTS portal_franqueado.v_dashboard_atrasados;
DROP VIEW IF EXISTS portal_franqueado.v_dashboard_faturas;
DROP VIEW IF EXISTS portal_franqueado.v_dashboard_notas;
DROP VIEW IF EXISTS portal_franqueado.v_dashboard_orcamentos;
DROP VIEW IF EXISTS portal_franqueado.v_dashboard_pedidos;
DROP TABLE IF EXISTS portal_franqueado.faturas;
DROP TABLE IF EXISTS portal_franqueado.notas_fiscais;
DROP TABLE IF EXISTS portal_franqueado.pedidos;
DROP TABLE IF EXISTS portal_franqueado.orcamentos;
DROP TABLE IF EXISTS portal_franqueado.faturamento_vendedor;
