import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { DiscoveryFilters, PriceItem } from '@rolego/contracts';
import type { JWK } from 'jose';

/** geography(Point,4326): escrita com ST_MakePoint; leitura sempre por SQL explícito (ST_X/ST_Y). */
export const geography = customType<{ data: string; driverData: string }>({
  dataType: () => 'geography(Point,4326)',
});
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => 'bytea' });
const citext = customType<{ data: string }>({ dataType: () => 'citext' });
const tsz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export type MediaVariants = Record<string, string>;

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  uf: text('uf').notNull(),
  center: geography('center').notNull(),
  timezone: text('timezone').notNull(),
  launchStatus: text('launch_status').$type<'live' | 'soon'>().notNull(),
});

export const eventTypes = pgTable('event_types', {
  slug: text('slug').primaryKey(),
  label: text('label').notNull(),
  accent: text('accent').$type<'cyan' | 'magenta' | 'yellow' | 'green' | 'violet'>().notNull(),
  sort: integer('sort').notNull(),
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey(),
  ownerUserId: uuid('owner_user_id'),
  kind: text('kind').$type<'avatar' | 'cover' | 'gallery'>().notNull(),
  status: text('status').$type<'processing' | 'ready' | 'failed'>().notNull(),
  variants: jsonb('variants').$type<MediaVariants>().notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: citext('email').notNull(),
  emailVerifiedAt: tsz('email_verified_at'),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  photoAssetId: uuid('photo_asset_id'),
  googleSub: text('google_sub'),
  appleSub: text('apple_sub'),
  adultDeclaredAt: tsz('adult_declared_at'),
  termsAcceptedAt: tsz('terms_accepted_at'),
  termsVersion: text('terms_version'),
  role: text('role').$type<'user' | 'admin'>().notNull(),
  status: text('status').$type<'active' | 'blocked' | 'deleted'>().notNull(),
  blockedReason: text('blocked_reason'),
  showPresence: boolean('show_presence').notNull(),
  emailBouncedAt: tsz('email_bounced_at'),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  updatedAt: tsz('updated_at').notNull().default(sql`now()`),
});

export const jwtKeys = pgTable('jwt_keys', {
  kid: text('kid').primaryKey(),
  publicJwk: jsonb('public_jwk').$type<JWK>().notNull(),
  privateJwkEncrypted: text('private_jwk_encrypted').notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  retiredAt: tsz('retired_at'),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  familyId: uuid('family_id').notNull(),
  tokenHash: bytea('token_hash').notNull(),
  replacedBy: uuid('replaced_by'),
  amr: text('amr').$type<'pwd' | 'google' | 'apple' | 'passkey'>().notNull(),
  userAgent: text('user_agent'),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  expiresAt: tsz('expires_at').notNull(),
  usedAt: tsz('used_at'),
  revokedAt: tsz('revoked_at'),
  revokedReason: text('revoked_reason').$type<'logout' | 'reuse' | 'reset' | 'block' | 'delete'>(),
});

export const passkeys = pgTable('passkeys', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  credentialId: bytea('credential_id').notNull(),
  publicKey: bytea('public_key').notNull(),
  signCount: bigint('sign_count', { mode: 'number' }).notNull(),
  transports: text('transports').array().notNull(),
  deviceName: text('device_name'),
  backedUp: boolean('backed_up').notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  lastUsedAt: tsz('last_used_at'),
});

export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  kind: text('kind').$type<'reset_password' | 'verify_email'>().notNull(),
  tokenHash: bytea('token_hash').notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  expiresAt: tsz('expires_at').notNull(),
  usedAt: tsz('used_at'),
});

export const discoveryPreferences = pgTable('discovery_preferences', {
  userId: uuid('user_id').primaryKey(),
  eventTypeSlugs: text('event_type_slugs').array().notNull(),
  cityId: uuid('city_id'),
  originMode: text('origin_mode').$type<'gps' | 'city' | 'override'>().notNull(),
  location: geography('location'),
  overrideCityId: uuid('override_city_id'),
  radiusKm: integer('radius_km').notNull(),
  filters: jsonb('filters').$type<Partial<DiscoveryFilters>>().notNull(),
  onboardedAt: tsz('onboarded_at'),
  updatedAt: tsz('updated_at').notNull().default(sql`now()`),
});

export const organizers = pgTable('organizers', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  slug: text('slug').notNull(),
  displayName: text('display_name').notNull(),
  kind: text('kind').$type<'person' | 'bar' | 'venue' | 'producer'>().notNull(),
  bio: text('bio'),
  instagram: text('instagram'),
  avatarAssetId: uuid('avatar_asset_id'),
  contactEmail: citext('contact_email'),
  claimedAt: tsz('claimed_at'),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  updatedAt: tsz('updated_at').notNull().default(sql`now()`),
});

export const eventSeries = pgTable('event_series', {
  id: uuid('id').primaryKey(),
  organizerId: uuid('organizer_id').notNull(),
  name: text('name').notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey(),
  organizerId: uuid('organizer_id').notNull(),
  seriesId: uuid('series_id'),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  typeSlug: text('type_slug').notNull(),
  description: text('description').notNull(),
  coverAssetId: uuid('cover_asset_id'),
  ageRating: text('age_rating').$type<'free' | '16' | '18'>().notNull(),
  startsAt: tsz('starts_at'),
  endsAt: tsz('ends_at'),
  timezone: text('timezone').notNull(),
  venueName: text('venue_name').notNull(),
  cep: text('cep'),
  street: text('street'),
  number: text('number'),
  complement: text('complement'),
  neighborhood: text('neighborhood').notNull(),
  cityId: uuid('city_id'),
  cityName: text('city_name').notNull(),
  uf: text('uf'),
  location: geography('location'),
  visibility: text('visibility').$type<'public' | 'private'>().notNull(),
  privateDiscoverable: boolean('private_discoverable').notNull(),
  approvalMode: text('approval_mode').$type<'manual' | 'auto'>().notNull(),
  accessCode: text('access_code'),
  capacity: integer('capacity'),
  priceItems: jsonb('price_items').$type<PriceItem[]>().notNull(),
  externalTicketUrl: text('external_ticket_url'),
  status: text('status').$type<'draft' | 'published' | 'cancelled' | 'removed'>().notNull(),
  cancelReason: text('cancel_reason'),
  publishedAt: tsz('published_at'),
  interestsCount: integer('interests_count').notNull(),
  goingCount: integer('going_count').notNull(),
  pendingCount: integer('pending_count').notNull(),
  viewsCount: integer('views_count').notNull(),
  ratingSum: integer('rating_sum').notNull(),
  ratingCount: integer('rating_count').notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  updatedAt: tsz('updated_at').notNull().default(sql`now()`),
});

export const eventMedia = pgTable(
  'event_media',
  { eventId: uuid('event_id').notNull(), assetId: uuid('asset_id').notNull(), position: integer('position').notNull() },
  (t) => [primaryKey({ columns: [t.eventId, t.assetId] })],
);

export const rsvps = pgTable('rsvps', {
  id: uuid('id').primaryKey(),
  eventId: uuid('event_id').notNull(),
  userId: uuid('user_id').notNull(),
  status: text('status')
    .$type<'pending' | 'confirmed' | 'approved' | 'declined' | 'cancelled_by_user' | 'cancelled_by_event'>()
    .notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  updatedAt: tsz('updated_at').notNull().default(sql`now()`),
  decidedAt: tsz('decided_at'),
  decidedBy: uuid('decided_by'),
  hereAt: tsz('here_at'),
});

export const interests = pgTable(
  'interests',
  { userId: uuid('user_id').notNull(), eventId: uuid('event_id').notNull(), createdAt: tsz('created_at').notNull().default(sql`now()`) },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

export const swipePasses = pgTable(
  'swipe_passes',
  { userId: uuid('user_id').notNull(), eventId: uuid('event_id').notNull(), createdAt: tsz('created_at').notNull().default(sql`now()`) },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey(),
  eventId: uuid('event_id').notNull(),
  userId: uuid('user_id').notNull(),
  rating: smallint('rating').notNull(),
  comment: text('comment'),
  status: text('status').$type<'visible' | 'hidden'>().notNull(),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  updatedAt: tsz('updated_at').notNull().default(sql`now()`),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey(),
  reporterId: uuid('reporter_id').notNull(),
  targetType: text('target_type').$type<'event' | 'review' | 'user' | 'organizer'>().notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  note: text('note'),
  status: text('status').$type<'open' | 'resolved' | 'dismissed'>().notNull(),
  resolvedBy: uuid('resolved_by'),
  resolution: text('resolution'),
  createdAt: tsz('created_at').notNull().default(sql`now()`),
  resolvedAt: tsz('resolved_at'),
});

export const shareClicks = pgTable('share_clicks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  eventId: uuid('event_id').notNull(),
  source: text('source').$type<'wa' | 'ig' | 'copy' | 'other'>().notNull(),
  at: tsz('at').notNull().default(sql`now()`),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  at: tsz('at').notNull().default(sql`now()`),
});

export const geocodeCache = pgTable('geocode_cache', {
  key: text('key').primaryKey(),
  result: jsonb('result').$type<Record<string, unknown>>().notNull(),
  fetchedAt: tsz('fetched_at').notNull().default(sql`now()`),
});
