-- RoleGo Beta — schema inicial (docs/05-modelo-de-dados.md)
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$ SELECT public.unaccent('public.unaccent', $1) $$;
--> statement-breakpoint
CREATE TABLE cities (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  uf text NOT NULL,
  center geography(Point,4326) NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  launch_status text NOT NULL DEFAULT 'soon' CHECK (launch_status IN ('live','soon'))
);
--> statement-breakpoint
CREATE TABLE event_types (
  slug text PRIMARY KEY,
  label text NOT NULL,
  accent text NOT NULL CHECK (accent IN ('cyan','magenta','yellow','green','violet')),
  sort int NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE media_assets (
  id uuid PRIMARY KEY,
  owner_user_id uuid,
  kind text NOT NULL CHECK (kind IN ('avatar','cover','gallery')),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('processing','ready','failed')),
  variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  email_verified_at timestamptz,
  password_hash text,
  name text NOT NULL DEFAULT '',
  photo_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  google_sub text UNIQUE,
  apple_sub text UNIQUE,
  adult_declared_at timestamptz,
  terms_accepted_at timestamptz,
  terms_version text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','deleted')),
  blocked_reason text,
  show_presence boolean NOT NULL DEFAULT true,
  email_bounced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_credential_chk CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL OR apple_sub IS NOT NULL OR status = 'deleted')
);
--> statement-breakpoint
ALTER TABLE media_assets ADD CONSTRAINT media_assets_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX media_assets_owner_idx ON media_assets (owner_user_id);
--> statement-breakpoint
CREATE TABLE jwt_keys (
  kid text PRIMARY KEY,
  public_jwk jsonb NOT NULL,
  private_jwk_encrypted text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz
);
--> statement-breakpoint
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL,
  token_hash bytea NOT NULL UNIQUE,
  replaced_by uuid,
  amr text NOT NULL CHECK (amr IN ('pwd','google','apple','passkey')),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text CHECK (revoked_reason IN ('logout','reuse','reset','block','delete'))
);
--> statement-breakpoint
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
CREATE TABLE passkeys (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id bytea NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  device_name text,
  backed_up boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
--> statement-breakpoint
CREATE INDEX passkeys_user_idx ON passkeys (user_id);
--> statement-breakpoint
CREATE TABLE auth_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reset_password','verify_email')),
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
--> statement-breakpoint
CREATE INDEX auth_tokens_user_idx ON auth_tokens (user_id);
--> statement-breakpoint
CREATE TABLE discovery_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  event_type_slugs text[] NOT NULL DEFAULT '{}',
  city_id uuid REFERENCES cities(id),
  origin_mode text NOT NULL DEFAULT 'city' CHECK (origin_mode IN ('gps','city','override')),
  location geography(Point,4326),
  override_city_id uuid REFERENCES cities(id),
  radius_km int NOT NULL DEFAULT 20 CHECK (radius_km BETWEEN 1 AND 100),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX discovery_preferences_city_idx ON discovery_preferences (city_id);
--> statement-breakpoint
CREATE TABLE organizers (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('person','bar','venue','producer')),
  bio text,
  instagram text,
  avatar_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  contact_email citext,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX organizers_user_uk ON organizers (user_id) WHERE user_id IS NOT NULL;
--> statement-breakpoint
CREATE TABLE event_series (
  id uuid PRIMARY KEY,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX event_series_organizer_idx ON event_series (organizer_id);
--> statement-breakpoint
CREATE TABLE events (
  id uuid PRIMARY KEY,
  organizer_id uuid NOT NULL REFERENCES organizers(id),
  series_id uuid REFERENCES event_series(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  type_slug text NOT NULL REFERENCES event_types(slug),
  description text NOT NULL DEFAULT '',
  cover_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  age_rating text NOT NULL DEFAULT 'free' CHECK (age_rating IN ('free','16','18')),
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  venue_name text NOT NULL DEFAULT '',
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text NOT NULL DEFAULT '',
  city_id uuid REFERENCES cities(id),
  city_name text NOT NULL DEFAULT '',
  uf text,
  location geography(Point,4326),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  private_discoverable boolean NOT NULL DEFAULT false,
  approval_mode text NOT NULL DEFAULT 'manual' CHECK (approval_mode IN ('manual','auto')),
  access_code text UNIQUE,
  capacity int CHECK (capacity IS NULL OR capacity > 0),
  price_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  external_ticket_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','removed')),
  cancel_reason text,
  published_at timestamptz,
  interests_count int NOT NULL DEFAULT 0 CHECK (interests_count >= 0),
  going_count int NOT NULL DEFAULT 0 CHECK (going_count >= 0),
  pending_count int NOT NULL DEFAULT 0 CHECK (pending_count >= 0),
  views_count int NOT NULL DEFAULT 0,
  rating_sum int NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  search tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', immutable_unaccent(coalesce(title,'') || ' ' || coalesce(venue_name,'')))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_time_chk CHECK (starts_at IS NULL OR ends_at IS NULL OR (ends_at > starts_at AND ends_at - starts_at <= interval '48 hours')),
  CONSTRAINT events_published_chk CHECK (status <> 'published' OR (cover_asset_id IS NOT NULL AND location IS NOT NULL AND starts_at IS NOT NULL AND ends_at IS NOT NULL)),
  CONSTRAINT events_private_code_chk CHECK (visibility = 'public' OR access_code IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX events_discovery_geo_idx ON events USING gist (location) WHERE status = 'published';
--> statement-breakpoint
CREATE INDEX events_discovery_time_idx ON events (ends_at, starts_at, id) WHERE status = 'published';
--> statement-breakpoint
CREATE INDEX events_organizer_idx ON events (organizer_id, starts_at DESC);
--> statement-breakpoint
CREATE INDEX events_series_idx ON events (series_id, starts_at DESC);
--> statement-breakpoint
CREATE INDEX events_city_idx ON events (city_id);
--> statement-breakpoint
CREATE INDEX events_search_idx ON events USING gin (search);
--> statement-breakpoint
CREATE INDEX events_title_trgm_idx ON events USING gin (immutable_unaccent(lower(title)) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX events_venue_trgm_idx ON events USING gin (immutable_unaccent(lower(venue_name)) gin_trgm_ops);
--> statement-breakpoint
CREATE TABLE event_media (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, asset_id)
);
--> statement-breakpoint
CREATE TABLE rsvps (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','confirmed','approved','declined','cancelled_by_user','cancelled_by_event')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid,
  here_at timestamptz,
  UNIQUE (event_id, user_id)
);
--> statement-breakpoint
CREATE INDEX rsvps_event_status_idx ON rsvps (event_id, status);
--> statement-breakpoint
CREATE INDEX rsvps_user_idx ON rsvps (user_id, status);
--> statement-breakpoint
CREATE TABLE interests (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
--> statement-breakpoint
CREATE INDEX interests_event_idx ON interests (event_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE swipe_passes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
--> statement-breakpoint
CREATE INDEX swipe_passes_event_idx ON swipe_passes (event_id);
--> statement-breakpoint
CREATE TABLE reviews (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 500),
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
--> statement-breakpoint
CREATE INDEX reviews_user_idx ON reviews (user_id);
--> statement-breakpoint
CREATE TABLE reports (
  id uuid PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('event','review','user','organizer')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolved_by uuid REFERENCES users(id),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (reporter_id, target_type, target_id)
);
--> statement-breakpoint
CREATE INDEX reports_status_idx ON reports (status, created_at);
--> statement-breakpoint
CREATE INDEX reports_target_idx ON reports (target_type, target_id);
--> statement-breakpoint
CREATE TABLE share_clicks (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('wa','ig','copy','other')),
  at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX share_clicks_event_idx ON share_clicks (event_id, at);
--> statement-breakpoint
CREATE TABLE audit_log (
  id uuid PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX audit_log_entity_idx ON audit_log (entity, entity_id);
--> statement-breakpoint
CREATE TABLE geocode_cache (
  key text PRIMARY KEY,
  result jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
