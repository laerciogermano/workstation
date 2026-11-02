-- Schema Tinder no Postgres Contabo (DB connectmax)
-- Antes: sem schema tinder → Depois: tinder.contas/perfis/conversas/mensagens
-- Rollback: DROP SCHEMA tinder CASCADE;

CREATE SCHEMA IF NOT EXISTS tinder;

CREATE TABLE IF NOT EXISTS tinder.contas (
  id            serial PRIMARY KEY,
  slug          text NOT NULL UNIQUE,
  nome          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tinder.perfis (
  id            serial PRIMARY KEY,
  conta_id      int NOT NULL REFERENCES tinder.contas(id) ON DELETE CASCADE,
  href          text NOT NULL,
  match_key     text,
  nome          text,
  bio           text,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_id, href)
);

CREATE INDEX IF NOT EXISTS perfis_nome_idx ON tinder.perfis (nome);

CREATE TABLE IF NOT EXISTS tinder.conversas (
  id                   serial PRIMARY KEY,
  conta_id             int NOT NULL REFERENCES tinder.contas(id) ON DELETE CASCADE,
  perfil_id            int NOT NULL REFERENCES tinder.perfis(id) ON DELETE CASCADE,
  href                 text NOT NULL,
  ultima_mensagem      text,
  quem_enviou          text CHECK (quem_enviou IS NULL OR quem_enviou IN ('eu','match')),
  respondi_por_ultimo  boolean,
  texto_bruto          text,
  total_mensagens      int NOT NULL DEFAULT 0,
  dumped_at            timestamptz,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_id, href)
);

CREATE INDEX IF NOT EXISTS conversas_pendentes_idx
  ON tinder.conversas (conta_id)
  WHERE quem_enviou = 'match' AND respondi_por_ultimo IS FALSE;

CREATE TABLE IF NOT EXISTS tinder.mensagens (
  id            serial PRIMARY KEY,
  conversa_id   int NOT NULL REFERENCES tinder.conversas(id) ON DELETE CASCADE,
  seq           int NOT NULL,
  quem          text NOT NULL CHECK (quem IN ('eu','match')),
  nome_exibido  text,
  texto         text NOT NULL,
  hora          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversa_id, seq)
);

CREATE INDEX IF NOT EXISTS mensagens_conversa_idx ON tinder.mensagens (conversa_id, seq);
