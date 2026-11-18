-- Flow.dev · schema inicial (PostgreSQL 18). Defaults do pacote core/06-banco-postgresql:
-- PK interna bigint identity · ID público uuidv7 (IDR) · text + CHECK · timestamptz · FK sempre indexada.
create schema if not exists flow;

create table flow.users (
  id            bigint generated always as identity primary key,
  public_id     uuid not null default uuidv7() unique,
  email         text not null check (char_length(email) between 3 and 200),
  password_hash text not null,
  name          text not null check (char_length(name) between 1 and 120),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index users_email_uq on flow.users (lower(email));

create table flow.sessions (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references flow.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_idx on flow.sessions (user_id);
create index sessions_expires_idx on flow.sessions (expires_at);

create table flow.projects (
  id         bigint generated always as identity primary key,
  public_id  uuid not null default uuidv7() unique,
  owner_id   bigint not null references flow.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index projects_owner_idx on flow.projects (owner_id) where deleted_at is null;

create table flow.plans (
  id         bigint generated always as identity primary key,
  public_id  uuid not null default uuidv7() unique,
  project_id bigint not null references flow.projects (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  position   int not null default 0
);
create index plans_project_idx on flow.plans (project_id);

create table flow.models (
  id         bigint generated always as identity primary key,
  public_id  uuid not null default uuidv7() unique,
  project_id bigint not null references flow.projects (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  api_id     text not null check (char_length(api_id) between 1 and 120),
  vendor     text not null check (char_length(vendor) between 1 and 120),
  color      text not null default '#8a8a8a' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);
create index models_project_idx on flow.models (project_id);

create table flow.agents (
  id          bigint generated always as identity primary key,
  public_id   uuid not null default uuidv7() unique,
  project_id  bigint not null references flow.projects (id) on delete cascade,
  kind        text not null check (kind in ('ia', 'pessoa', 'maquina', 'script')),
  name        text not null check (char_length(name) between 1 and 120),
  sub         text not null default '' check (char_length(sub) <= 200),
  module_file text,
  model_id    bigint references flow.models (id) on delete set null,
  prompt      text check (char_length(prompt) <= 8000),
  photo_url   text,
  created_at  timestamptz not null default now()
);
create index agents_project_idx on flow.agents (project_id);
create index agents_model_idx on flow.agents (model_id);

create table flow.elements (
  id           bigint generated always as identity primary key,
  public_id    uuid not null default uuidv7() unique,
  project_id   bigint not null references flow.projects (id) on delete cascade,
  plan_id      bigint not null references flow.plans (id) on delete cascade,
  parent_id    bigint references flow.elements (id) on delete cascade,
  kind         text not null check (kind in ('folder', 'file', 'data')),
  title        text not null check (char_length(title) between 1 and 200),
  context      text check (char_length(context) <= 2000),
  agent_id     bigint references flow.agents (id) on delete set null,
  resp_id      bigint references flow.agents (id) on delete set null,
  status       text check (status in ('pendente', 'exec', 'ok', 'fail', 'cancel')),
  error        text,
  progress     numeric(4, 3) check (progress between 0 and 1),
  loop_var     text,
  loop_list    text,
  cond_test    text,
  cond_goto_id bigint references flow.elements (id) on delete set null,
  code         text check (char_length(code) <= 100000),
  archived     boolean not null default false,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((loop_var is null) = (loop_list is null)),
  check ((cond_test is null) = (cond_goto_id is null) or cond_goto_id is null)
);
create index elements_project_idx on flow.elements (project_id, parent_id, position);
create index elements_plan_idx on flow.elements (plan_id);
create index elements_parent_idx on flow.elements (parent_id);
create index elements_agent_idx on flow.elements (agent_id);
create index elements_resp_idx on flow.elements (resp_id);
create index elements_goto_idx on flow.elements (cond_goto_id);

create table flow.element_ios (
  id         bigint generated always as identity primary key,
  element_id bigint not null references flow.elements (id) on delete cascade,
  direction  text not null check (direction in ('in', 'out')),
  name       text not null check (char_length(name) between 1 and 160),
  ref        text,
  position   int not null default 0,
  unique (element_id, direction, name)
);
create index element_ios_element_idx on flow.element_ios (element_id, direction, position);
create index element_ios_name_idx on flow.element_ios (name);

create table flow.links (
  from_id bigint not null references flow.elements (id) on delete cascade,
  to_id   bigint not null references flow.elements (id) on delete cascade,
  kind    text not null check (kind in ('seq', 'par')),
  primary key (from_id, to_id, kind),
  check (from_id <> to_id)
);
create index links_to_idx on flow.links (to_id);

create table flow.structs (
  id         bigint generated always as identity primary key,
  project_id bigint not null references flow.projects (id) on delete cascade,
  test       text not null check (char_length(test) between 1 and 200),
  position   int not null default 0
);
create index structs_project_idx on flow.structs (project_id);

create table flow.struct_members (
  struct_id  bigint not null references flow.structs (id) on delete cascade,
  element_id bigint not null references flow.elements (id) on delete cascade,
  position   int not null default 0,
  primary key (struct_id, element_id)
);
create index struct_members_element_idx on flow.struct_members (element_id);

create table flow.data_defs (
  id         bigint generated always as identity primary key,
  project_id bigint not null references flow.projects (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 160),
  type       text not null default 'texto' check (type in ('texto', 'numero', 'inteiro', 'booleano', 'data', 'lista', 'objeto', 'arquivo')),
  value      text check (char_length(value) <= 10000),
  position   int not null default 0,
  unique (project_id, name)
);

create table flow.modules (
  id         bigint generated always as identity primary key,
  public_id  uuid not null default uuidv7() unique,
  project_id bigint not null references flow.projects (id) on delete cascade,
  file       text not null check (char_length(file) between 1 and 120),
  position   int not null default 0,
  unique (project_id, file)
);

create table flow.module_items (
  id         bigint generated always as identity primary key,
  module_id  bigint not null references flow.modules (id) on delete cascade,
  kind       text not null check (kind in ('fn', 'dado', 'script')),
  element_id bigint references flow.elements (id) on delete cascade,
  agent_id   bigint references flow.agents (id) on delete cascade,
  data_name  text,
  position   int not null default 0,
  check ((kind = 'fn' and element_id is not null and agent_id is null and data_name is null)
      or (kind = 'script' and agent_id is not null and element_id is null and data_name is null)
      or (kind = 'dado' and data_name is not null and element_id is null and agent_id is null))
);
create index module_items_module_idx on flow.module_items (module_id, position);
create index module_items_element_idx on flow.module_items (element_id);
create index module_items_agent_idx on flow.module_items (agent_id);

-- updated_at automático
create function flow.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger users_touch before update on flow.users for each row execute function flow.touch_updated_at();
create trigger projects_touch before update on flow.projects for each row execute function flow.touch_updated_at();
create trigger elements_touch before update on flow.elements for each row execute function flow.touch_updated_at();
