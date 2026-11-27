-- Esquema inicial (docs/modelagem-dados.md). IDs uuid v7, dinheiro numeric, tempo timestamptz.
create table organizations (
  id uuid primary key default uuidv7(),
  name text not null,
  acronym text not null
);

create table events (
  id uuid primary key default uuidv7(),
  organization_id uuid not null references organizations on delete restrict,
  name text not null check (length(name) between 3 and 120),
  slug text not null unique,
  starts_on date,
  ends_on date,
  city text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  modules jsonb not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default uuidv7(),
  email text not null,
  password_hash text not null,
  name text not null check (length(name) between 2 and 120),
  phone text not null default '',
  city text not null default '',
  country text not null default 'Brasil',
  photo text,
  shortcuts text[] not null default '{membership_card,tickets,parking,buy}',
  mfa_enabled boolean not null default false,
  mfa_method text check (mfa_method in ('app','sms','email')),
  token_version int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index users_email_key on users (lower(email)) where deleted_at is null;

create table mfa_factors (
  id uuid primary key default uuidv7(),
  user_id uuid not null references users on delete cascade,
  method text not null check (method in ('app','sms','email')),
  secret text,
  last_step bigint not null default 0,
  is_active boolean not null default true,
  unique (user_id, method)
);

create table backup_codes (
  id uuid primary key default uuidv7(),
  user_id uuid not null references users on delete cascade,
  code_hash text not null,
  used_at timestamptz
);
create index on backup_codes (user_id);

create table trusted_devices (
  id uuid primary key default uuidv7(),
  user_id uuid not null references users on delete cascade,
  token_hash text not null unique,
  label text not null default '',
  expires_at timestamptz not null
);
create index on trusted_devices (user_id);

-- códigos em andamento: login, ativação e confirmação de mudança sensível
create table challenges (
  id uuid primary key default uuidv7(),
  user_id uuid not null references users on delete cascade,
  purpose text not null check (purpose in ('login','setup','stepup')),
  method text not null check (method in ('app','sms','email','backup')),
  code_hash text,
  secret text,
  phone text,
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on challenges (user_id, created_at);

create table attendees (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  user_id uuid not null references users on delete restrict,
  lodge text not null default '',
  obedience text not null default '',
  cim text not null default '',
  office text not null default '',
  roles text[] not null default '{attendee}' check (roles <@ array['attendee','family','organizer','auctioneer']),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index on attendees (user_id);

create table venues (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  address text not null,
  capacity int not null check (capacity > 0),
  lat double precision not null,
  lng double precision not null
);
create index on venues (event_id);

create table rooms (
  id uuid primary key default uuidv7(),
  venue_id uuid not null references venues on delete cascade,
  name text not null,
  capacity int not null check (capacity > 0),
  reserved_note text
);
create index on rooms (venue_id);

create table sessions (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  venue_id uuid not null references venues on delete restrict,
  room_id uuid references rooms on delete set null,
  title text not null check (length(title) between 3 and 140),
  description text not null default '',
  kind text not null default 'Evento',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null check (capacity > 0),
  image_url text,
  check (ends_at > starts_at)
);
create index on sessions (event_id, starts_at);
create index on sessions (venue_id);

create table registrations (
  id uuid primary key default uuidv7(),
  session_id uuid not null references sessions on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed')),
  created_at timestamptz not null default now(),
  unique (session_id, attendee_id)
);
create index on registrations (attendee_id);

create table check_ins (
  id uuid primary key default uuidv7(),
  registration_id uuid not null unique references registrations on delete cascade,
  at timestamptz not null default now()
);

create table orders (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  source text not null check (source in ('shop','auction','ticket','membership','cost_share')),
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  total numeric(12,2) not null check (total >= 0),
  ref_id uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on orders (attendee_id, created_at);
create index on orders (event_id);

create table order_items (
  order_id uuid not null references orders on delete cascade,
  seq int not null,
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  ref_id uuid,
  primary key (order_id, seq)
);

create table ticket_types (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  session_id uuid not null references sessions on delete cascade,
  name text not null,
  price numeric(12,2) not null check (price > 0),
  unique (session_id, name)
);
create index on ticket_types (event_id);

create table tickets (
  id uuid primary key default uuidv7(),
  ticket_type_id uuid not null references ticket_types on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  order_id uuid not null references orders on delete cascade,
  status text not null default 'valid' check (status in ('valid','used')),
  code text not null unique
);
create index on tickets (attendee_id);
create index on tickets (order_id);
create index on tickets (ticket_type_id);

-- GroupChat e DirectChat da modelagem numa tabela só, para a mensagem ter FK real
create table chats (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  type text not null check (type in ('group','direct')),
  session_id uuid unique references sessions on delete cascade,
  direct_key text unique,
  check ((type = 'group') = (session_id is not null)),
  check ((type = 'direct') = (direct_key is not null))
);
create index on chats (event_id);

create table chat_members (
  chat_id uuid not null references chats on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  last_read_at timestamptz not null default 'epoch',
  primary key (chat_id, attendee_id)
);
create index on chat_members (attendee_id);

create table messages (
  id uuid primary key default uuidv7(),
  chat_id uuid not null references chats on delete cascade,
  author_id uuid not null references attendees on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  sent_at timestamptz not null default now()
);
create index on messages (chat_id, sent_at);
create index on messages (author_id);

create table products (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null default 'package',
  price numeric(12,2) not null check (price > 0),
  stock int not null check (stock >= 0)
);
create index on products (event_id);

create table auctions (
  id uuid primary key default uuidv7(),
  event_id uuid not null unique references events on delete cascade,
  session_id uuid references sessions on delete set null,
  venue_id uuid references venues on delete set null,
  title text not null,
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','open','closed')),
  bid_step numeric(12,2) not null default 100 check (bid_step > 0),
  called_at timestamptz
);

create table lots (
  id uuid primary key default uuidv7(),
  auction_id uuid not null references auctions on delete cascade,
  title text not null check (length(title) between 3 and 140),
  description text not null default '',
  starting_bid numeric(12,2) not null check (starting_bid > 0),
  status text not null default 'open' check (status in ('open','sold')),
  winner_id uuid references attendees on delete set null,
  created_at timestamptz not null default now()
);
create index on lots (auction_id);
create index on lots (winner_id);

create table bids (
  id uuid primary key default uuidv7(),
  lot_id uuid not null references lots on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  at timestamptz not null default now(),
  unique (lot_id, amount)
);
create index on bids (attendee_id);

create table vouchers (
  id uuid primary key default uuidv7(),
  attendee_id uuid not null references attendees on delete cascade,
  type text not null default 'meal',
  title text not null,
  place text not null,
  valid_on date not null,
  status text not null default 'available' check (status in ('available','used')),
  code text not null unique
);
create index on vouchers (attendee_id);

create table parking_areas (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  venue_id uuid not null references venues on delete cascade,
  period text not null,
  capacity int not null check (capacity >= 0)
);
create index on parking_areas (event_id);
create index on parking_areas (venue_id);

create table parking_spots (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  area_id uuid not null references parking_areas on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  code text not null,
  unique (area_id, attendee_id)
);
create index on parking_spots (attendee_id);
create index on parking_spots (event_id);

create table memberships (
  id uuid primary key default uuidv7(),
  attendee_id uuid not null unique references attendees on delete cascade,
  status text not null check (status in ('good_standing','overdue')),
  valid_until date not null
);

create table membership_payments (
  id uuid primary key default uuidv7(),
  membership_id uuid not null references memberships on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_on date not null,
  paid_at timestamptz
);
create index on membership_payments (membership_id);

create table cost_shares (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  title text not null,
  total numeric(12,2) not null check (total > 0),
  parts int not null check (parts > 0)
);
create index on cost_shares (event_id);

create table cost_share_members (
  cost_share_id uuid not null references cost_shares on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  is_paid boolean not null default false,
  primary key (cost_share_id, attendee_id)
);
create index on cost_share_members (attendee_id);

create table network_companies (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  name text not null,
  industry text not null
);
create index on network_companies (event_id);
create index on network_companies (attendee_id);

create table news (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz not null default now()
);
create index on news (event_id, published_at);

create table notifications (
  id uuid primary key default uuidv7(),
  attendee_id uuid not null references attendees on delete cascade,
  title text not null,
  body text not null,
  target text not null default '/',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (attendee_id, created_at);

create table collection_items (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  category text not null,
  title text not null,
  year int not null,
  location text not null,
  temperature numeric(4,1),
  humidity numeric(4,1),
  conservation text not null check (conservation in ('ok','attention')),
  security text not null,
  icon text not null default 'landmark'
);
create index on collection_items (event_id);

create table risks (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  title text not null check (length(title) between 3 and 200),
  level text not null check (level in ('low','medium','high')),
  owner_id uuid references attendees on delete set null,
  plan text not null default '',
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);
create index on risks (event_id);
create index on risks (owner_id);

create table consents (
  id uuid primary key default uuidv7(),
  user_id uuid not null references users on delete cascade,
  type text not null check (type in ('analytics','facial')),
  accepted boolean not null,
  at timestamptz not null default now()
);
create index on consents (user_id, type, at);

-- só o aceite: nenhum dado biométrico é guardado
create table facial_opt_ins (
  id uuid primary key default uuidv7(),
  attendee_id uuid not null unique references attendees on delete cascade,
  template_ref text,
  is_active boolean not null default true
);

create table support_tickets (
  id uuid primary key default uuidv7(),
  number int generated always as identity (start with 101),
  event_id uuid not null references events on delete cascade,
  attendee_id uuid not null references attendees on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','answered')),
  created_at timestamptz not null default now()
);
create index on support_tickets (attendee_id);
create index on support_tickets (event_id);

create table join_requests (
  id uuid primary key default uuidv7(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  city text not null default '',
  contact text not null,
  created_at timestamptz not null default now()
);
create index on join_requests (event_id);
