-- 0001 — esquema inicial do e-mail marketing.
-- Convenções: core/definir-projeto-moderno/06-banco-postgresql/POSTGRES.md
--   PK interna bigint identity; id público uuid; timestamptz; text + CHECK;
--   integridade no banco; todo FK indexado.

create schema if not exists email_marketing;
set search_path to email_marketing;

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Operadores do front-end ------------------------------------------------
create table operators (
  id            bigint generated always as identity primary key,
  public_id     uuid not null default gen_random_uuid() unique,
  email         text not null unique check (email = lower(email) and length(email) between 3 and 320),
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger operators_updated_at before update on operators
  for each row execute function set_updated_at();

create table sessions (
  id          bigint generated always as identity primary key,
  token_hash  text not null unique,
  operator_id bigint not null references operators (id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index sessions_operator_id_idx on sessions (operator_id);
create index sessions_expires_at_idx on sessions (expires_at);

-- Listas e contatos (CU-01) -----------------------------------------------
create table lists (
  id         bigint generated always as identity primary key,
  public_id  uuid not null default gen_random_uuid() unique,
  name       text not null check (length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger lists_updated_at before update on lists
  for each row execute function set_updated_at();

create table contacts (
  id         bigint generated always as identity primary key,
  public_id  uuid not null default gen_random_uuid() unique,
  list_id    bigint not null references lists (id) on delete cascade,
  email      text not null check (email = lower(email) and length(email) between 3 and 320),
  name       text check (name is null or length(name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- também serve de índice do FK list_id (coluna líder)
  constraint contacts_list_email_key unique (list_id, email)
);
create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

-- Descadastro global: e-mail aqui nunca recebe campanha de nenhuma lista.
create table suppressions (
  email      text primary key check (email = lower(email)),
  reason     text not null check (reason in ('unsubscribe', 'manual')),
  created_at timestamptz not null default now()
);

-- Campanhas (CU-02, CU-03) --------------------------------------------------
create table campaigns (
  id          bigint generated always as identity primary key,
  public_id   uuid not null default gen_random_uuid() unique,
  name        text not null check (length(btrim(name)) between 1 and 120),
  subject     text not null default '' check (length(subject) <= 200),
  body_html   text not null default '' check (length(body_html) <= 200000),
  list_id     bigint references lists (id) on delete restrict,
  status      text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint campaigns_sending_has_list check (status = 'draft' or list_id is not null)
);
create index campaigns_list_id_idx on campaigns (list_id);
create trigger campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();

-- Envios (CU-04, CU-05) -----------------------------------------------------
-- Uma linha por destinatário, criada no disparo (snapshot da lista).
-- A tabela é também a fila do worker (FOR UPDATE SKIP LOCKED) — ver ADR 0002.
create table deliveries (
  id              bigint generated always as identity primary key,
  public_id       uuid not null default gen_random_uuid() unique,
  campaign_id     bigint not null references campaigns (id) on delete cascade,
  contact_id      bigint references contacts (id) on delete set null,
  email           text not null,
  name            text,
  status          text not null default 'pending'
                  check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts        integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at       timestamptz,
  last_error      text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint deliveries_campaign_email_key unique (campaign_id, email)
);
create index deliveries_contact_id_idx on deliveries (contact_id);
-- fila: só o que está pronto para sair
create index deliveries_queue_idx on deliveries (next_attempt_at, id) where status = 'pending';
-- recuperação de travas órfãs
create index deliveries_sending_idx on deliveries (locked_at) where status = 'sending';
create trigger deliveries_updated_at before update on deliveries
  for each row execute function set_updated_at();
