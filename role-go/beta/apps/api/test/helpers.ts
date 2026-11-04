import type { INestApplication } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Ambiente de teste ANTES de carregar a app (env() é lida de forma preguiçosa).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://rolego:rolego@localhost:5432/rolego_test';
process.env.APP_URL = 'http://localhost:5173';
process.env.JWT_KEK = Buffer.alloc(32, 7).toString('base64');
process.env.GEOCODER = 'fake';
process.env.WORKER_INLINE = 'false';
process.env.MEDIA_DIR = mkdtempSync(path.join(os.tmpdir(), 'rolego-media-'));

import type { Db } from '../src/shared/db/db';

export const CURITIBA = { lat: -25.4284, lng: -49.2733 };
/** Ponto a `km` ao norte de `p` (aprox. 111,32 km por grau de latitude). */
export const north = (p: { lat: number; lng: number }, km: number) => ({ lat: p.lat + km / 111.32, lng: p.lng });

export type Ctx = { app: INestApplication; url: string; db: Db; cityId: string };

export async function boot(): Promise<Ctx> {
  const { createApp } = await import('../src/bootstrap');
  const { DB } = await import('../src/shared/db/db');
  const { runMigrations } = await import('../src/shared/db/migrate');
  const app = await createApp({ logger: false });
  const db = app.get<Db>(DB);
  await runMigrations(db);
  await app.listen(0);
  const addr = app.getHttpServer().address() as { port: number };
  const cityId = await reset(db);
  return { app, url: `http://127.0.0.1:${addr.port}`, db, cityId };
}

export async function reset(db: Db): Promise<string> {
  const { newId } = await import('../src/shared/kernel/ids');
  await db.execute(sql`TRUNCATE share_clicks, reports, reviews, rsvps, interests, swipe_passes, event_media, events, event_series,
    organizers, discovery_preferences, auth_tokens, passkeys, refresh_tokens, audit_log, geocode_cache, users, media_assets, cities, event_types CASCADE`);
  await db.execute(sql`INSERT INTO event_types (slug, label, accent, sort) VALUES ('festas','Festas','magenta',0), ('social','Social','yellow',1)`);
  const cityId = newId();
  await db.execute(sql`INSERT INTO cities (id, slug, name, uf, center, launch_status) VALUES (${cityId}, 'curitiba', 'Curitiba', 'PR', ST_SetSRID(ST_MakePoint(${CURITIBA.lng}, ${CURITIBA.lat}), 4326)::geography, 'live')`);
  return cityId;
}

/** Cliente HTTP com cookie jar (um por usuário). */
export class Client {
  private cookies = new Map<string, string>();
  constructor(private readonly base: string) {}
  cookie(name: string): string | undefined {
    return this.cookies.get(name);
  }
  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }
  async req<T = unknown>(method: string, p: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; body: T }> {
    const res = await fetch(`${this.base}${p}`, {
      method,
      headers: {
        'X-Requested-With': 'rolego',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const [k, ...v] = (pair ?? '').split('=');
      if (k) {
        if (/Max-Age=0|Expires=Thu, 01 Jan 1970/.test(c)) this.cookies.delete(k);
        else this.cookies.set(k, v.join('='));
      }
    }
    const text = await res.text();
    return { status: res.status, body: (text ? JSON.parse(text) : undefined) as T };
  }
  get<T = unknown>(p: string) {
    return this.req<T>('GET', `/api/v1${p}`);
  }
  post<T = unknown>(p: string, body: unknown = {}) {
    return this.req<T>('POST', `/api/v1${p}`, body);
  }
}

let n = 0;
/** Cria usuário via API, conclui o onboarding em Curitiba e devolve o cliente logado. */
export async function user(ctx: Ctx, opts: { verified?: boolean; origin?: { lat: number; lng: number }; radiusKm?: number } = {}): Promise<{ client: Client; id: string; email: string }> {
  const client = new Client(ctx.url);
  const email = `u${++n}-${Date.now()}@teste.dev`;
  const r = await client.post<{ id: string }>('/auth/register', { email, password: 'senha-forte-123', passwordConfirm: 'senha-forte-123', acceptTerms: true, adult: true });
  if (r.status !== 201) throw new Error(`register ${r.status} ${JSON.stringify(r.body)}`);
  const prefs = { eventTypes: ['festas', 'social'], cityId: ctx.cityId, radiusKm: opts.radiusKm ?? 20, ...(opts.origin ? { originMode: 'gps', location: opts.origin } : {}) };
  await client.req('PATCH', '/api/v1/me/preferences', prefs);
  await client.post('/me/onboarding/complete');
  if (opts.verified) await ctx.db.execute(sql`UPDATE users SET email_verified_at = now() WHERE id = ${r.body.id}`);
  return { client, id: r.body.id, email };
}

/** Insere um evento publicado direto no banco (fixture). */
export async function event(
  ctx: Ctx,
  over: { organizerUserId?: string | null; at?: { lat: number; lng: number }; visibility?: 'public' | 'private'; capacity?: number | null; discoverable?: boolean; approval?: 'manual' | 'auto'; title?: string; startsInH?: number; code?: string } = {},
): Promise<{ id: string; slug: string; organizerId: string }> {
  const { newId } = await import('../src/shared/kernel/ids');
  const orgId = newId();
  const id = newId();
  const slug = `ev-${id.slice(-8)}`;
  const p = over.at ?? CURITIBA;
  const start = new Date(Date.now() + (over.startsInH ?? 24) * 3600_000);
  const coverId = newId();
  await ctx.db.execute(sql`INSERT INTO media_assets (id, kind, status, variants) VALUES (${coverId}, 'cover', 'ready', '{"card":"cover/x-card.webp","thumb":"cover/x-thumb.webp","og":"cover/x-og.webp"}')`);
  await ctx.db.execute(sql`INSERT INTO organizers (id, user_id, slug, display_name, kind) VALUES (${orgId}, ${over.organizerUserId ?? null}, ${`org-${orgId.slice(-8)}`}, 'Org Teste', 'venue')`);
  const priv = over.visibility === 'private';
  await ctx.db.execute(sql`INSERT INTO events (id, organizer_id, slug, title, type_slug, cover_asset_id, starts_at, ends_at, venue_name, street, number, cep, neighborhood,
      city_id, city_name, location, visibility, private_discoverable, approval_mode, access_code, capacity, status, published_at)
    VALUES (${id}, ${orgId}, ${slug}, ${over.title ?? 'Evento teste'}, 'festas', ${coverId}, ${start}, ${new Date(start.getTime() + 4 * 3600_000)}, 'Casa Secreta',
      'Rua Secreta', '123', '80000-000', 'Centro', ${ctx.cityId}, 'Curitiba', ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography,
      ${priv ? 'private' : 'public'}, ${over.discoverable ?? false}, ${over.approval ?? 'manual'}, ${priv ? (over.code ?? `C${id.slice(-5).toUpperCase().replace(/[01ILO]/g, 'X')}`) : null},
      ${over.capacity ?? null}, 'published', now())`);
  return { id, slug, organizerId: orgId };
}
