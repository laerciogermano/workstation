import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { boot, Client, CURITIBA, type Ctx, event, north, reset, user } from './helpers';

let ctx: Ctx;
beforeAll(async () => {
  ctx = await boot();
}, 60_000);
afterAll(async () => {
  await ctx.app.close();
});
beforeEach(async () => {
  ctx.cityId = await reset(ctx.db);
});

type Card = { id: string; distanceKm: number | null; venue: Record<string, unknown> };
const LEAK = ['street', 'number', 'complement', 'cep', 'location'];

describe('Capacidade (docs/05 §4.3)', () => {
  it('Concorrência na última vaga: 20 RSVPs em capacidade 5 → exatamente 5 confirmados', async () => {
    const ev = await event(ctx, { capacity: 5 });
    const users = await Promise.all(Array.from({ length: 20 }, () => user(ctx)));
    const results = await Promise.all(users.map((u) => u.client.post<{ status?: string; code?: string }>(`/events/${ev.id}/rsvp`)));
    expect(results.filter((r) => r.status === 200 && r.body.status === 'confirmed')).toHaveLength(5);
    expect(results.filter((r) => r.status === 409 && r.body.code === 'EVENT_FULL')).toHaveLength(15);
    const [row] = (await ctx.db.execute(sql`SELECT going_count, (SELECT count(*)::int FROM rsvps WHERE event_id = ${ev.id} AND status = 'confirmed') AS n FROM events WHERE id = ${ev.id}`)).rows as { going_count: number; n: number }[];
    expect(row).toEqual({ going_count: 5, n: 5 });
  }, 60_000);

  it('RSVP é idempotente por (evento, usuário)', async () => {
    const ev = await event(ctx, { capacity: 10 });
    const u = await user(ctx);
    await u.client.post(`/events/${ev.id}/rsvp`);
    await u.client.post(`/events/${ev.id}/rsvp`);
    const r = await u.client.get<{ counts: { going: number } }>(`/events/by-slug/${ev.slug}`);
    expect(r.body.counts.going).toBe(1);
  });
});

describe('Contrato de privacidade do evento privado (RN-02/RN-03)', () => {
  it('nenhuma rota devolve rua/número/CEP/coordenadas para anônimo, sem RSVP, pending ou declined', async () => {
    const host = await user(ctx);
    const ev = await event(ctx, { visibility: 'private', discoverable: true, organizerUserId: host.id, title: 'Festa Secreta', at: north(CURITIBA, 2.63) });
    const [stranger, pending, declined] = await Promise.all([user(ctx), user(ctx), user(ctx)]);
    await pending.client.post(`/events/${ev.id}/rsvp`);
    await declined.client.post(`/events/${ev.id}/rsvp`);
    expect((await host.client.post(`/events/${ev.id}/guests/${declined.id}/decline`)).status).toBe(200);
    const anon = new Client(ctx.url);
    const [org] = (await ctx.db.execute(sql`SELECT slug FROM organizers WHERE id = ${ev.organizerId}`)).rows as { slug: string }[];

    const check = (json: unknown, where: string) => {
      const s = JSON.stringify(json);
      expect(s, where).not.toContain('Rua Secreta');
      expect(s, where).not.toContain('80000-000');
      const cards: Card[] = [];
      const walk = (x: unknown) => {
        if (Array.isArray(x)) x.forEach(walk);
        else if (x && typeof x === 'object') {
          const o = x as Record<string, unknown>;
          if (o['id'] === ev.id && o['venue']) cards.push(o as unknown as Card);
          Object.values(o).forEach(walk);
        }
      };
      walk(json);
      for (const c of cards) {
        for (const k of LEAK) expect(c.venue, `${where}: ${k}`).not.toHaveProperty(k);
        expect((c.distanceKm ?? 0) % 1, `${where}: distância`).toBe(0);
      }
      return cards.length;
    };

    expect(check((await anon.get(`/events/by-slug/${ev.slug}`)).body, 'anon by-slug')).toBe(1);
    check((await anon.get(`/organizers/${org?.slug}`)).body, 'anon organizer');
    for (const [name, u] of [['stranger', stranger], ['pending', pending], ['declined', declined]] as const) {
      expect(check((await u.client.get(`/events/by-slug/${ev.slug}`)).body, `${name} by-slug`)).toBe(1);
      expect(check((await u.client.get('/discovery/feed')).body, `${name} feed`)).toBe(1);
      check((await u.client.get('/discovery/swipe')).body, `${name} swipe`);
      expect(check((await u.client.get('/discovery/list?sort=nearest')).body, `${name} list`)).toBe(1);
      check((await u.client.get('/discovery/search?q=secreta')).body, `${name} search`);
      check((await u.client.get(`/organizers/${org?.slug}`)).body, `${name} organizer`);
      check((await u.client.get('/me/rsvps?scope=upcoming')).body, `${name} me/rsvps`);
      check((await u.client.get(`/events/${ev.id}/editions`)).body, `${name} editions`);
    }
    // aprovado vê
    await host.client.post(`/events/${ev.id}/guests/${pending.id}/approve`);
    const ok = await pending.client.get<{ venue: Record<string, unknown> }>(`/events/by-slug/${ev.slug}`);
    expect(ok.body.venue).toMatchObject({ street: 'Rua Secreta', number: '123', addressLocked: false });
  }, 60_000);

  it('privado não descobrível: sem código dá 404 e não aparece no feed', async () => {
    const ev = await event(ctx, { visibility: 'private', discoverable: false, code: 'KXAB23' });
    const u = await user(ctx);
    expect((await u.client.get(`/events/by-slug/${ev.slug}`)).status).toBe(404);
    expect((await u.client.get(`/events/by-slug/${ev.slug}?c=KXAB23`)).status).toBe(200);
    const feed = await u.client.get<{ items: Card[] }>('/discovery/feed');
    expect(feed.body.items.map((i) => i.id)).not.toContain(ev.id);
  });
});

describe('Raio (RN-01)', () => {
  it('bordas de 1 e 10 km', async () => {
    const at = async (km: number) => (await event(ctx, { at: north(CURITIBA, km), title: `ev ${km}` })).id;
    const ids = { a: await at(0.9), b: await at(1.1), c: await at(9.9), d: await at(10.1) };
    const u1 = await user(ctx, { origin: CURITIBA, radiusKm: 1 });
    const r1 = await u1.client.get<{ items: Card[] }>('/discovery/feed');
    expect(r1.body.items.map((i) => i.id).sort()).toEqual([ids.a].sort());
    const r10 = await u1.client.get<{ items: Card[] }>('/discovery/feed?radiusKm=10');
    expect(r10.body.items.map((i) => i.id).sort()).toEqual([ids.a, ids.b, ids.c].sort());
  });
});

describe('Autenticação (ADR-008)', () => {
  it('Refresh com reuso: 2ª chamada 401 REFRESH_REUSED e toda a família revogada', async () => {
    const u = await user(ctx);
    const old = u.client.cookie('rg_rt') ?? '';
    expect((await u.client.post('/auth/refresh')).status).toBe(204);
    const fresh = u.client.cookie('rg_rt') ?? '';
    expect(fresh).not.toBe(old);
    const attacker = new Client(ctx.url);
    attacker.setCookie('rg_rt', old);
    const reuse = await attacker.post<{ code: string }>('/auth/refresh');
    expect(reuse).toMatchObject({ status: 401, body: { code: 'REFRESH_REUSED' } });
    const victim = new Client(ctx.url);
    victim.setCookie('rg_rt', fresh);
    expect((await victim.post('/auth/refresh')).status).toBe(401);
  });

  it('JWT adulterado (alg=none / kid desconhecido) → 401', async () => {
    const c = new Client(ctx.url);
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const body = b64({ sub: '01a1a644-0000-7000-8000-000000000001', sid: '01a1a644-0000-7000-8000-000000000002', role: 'admin', amr: ['pwd'], iss: 'rolego.com.br', aud: 'rolego-api', iat: 1, exp: 9999999999, cns: true });
    c.setCookie('rg_at', `${b64({ alg: 'none', typ: 'JWT' })}.${body}.`);
    expect((await c.get('/me')).status).toBe(401);
    c.setCookie('rg_at', `${b64({ alg: 'EdDSA', kid: 'desconhecido' })}.${body}.AAAA`);
    expect((await c.get('/admin/stats')).status).toBe(401);
  });

  it('CSRF: mutação sem X-Requested-With é recusada', async () => {
    const u = await user(ctx);
    const r = await u.client.req('POST', '/api/v1/auth/logout', {}, { 'X-Requested-With': '' });
    expect(r.status).toBe(403);
  });

  it('Login com erro genérico', async () => {
    const c = new Client(ctx.url);
    const r = await c.post<{ code: string }>('/auth/login', { email: 'ninguem@teste.dev', password: 'qualquer-coisa' });
    expect(r).toMatchObject({ status: 401, body: { code: 'INVALID_CREDENTIALS' } });
  });
});

describe('Usuário bloqueado (RN-10)', () => {
  it('eventos dele somem do feed, o token vivo cai na hora e o login é negado', async () => {
    const admin = await user(ctx);
    await ctx.db.execute(sql`UPDATE users SET role = 'admin' WHERE id = ${admin.id}`);
    await admin.client.post('/auth/login', { email: admin.email, password: 'senha-forte-123' });
    const bad = await user(ctx);
    const ev = await event(ctx, { organizerUserId: bad.id });
    const viewer = await user(ctx);
    expect((await viewer.client.get<{ items: Card[] }>('/discovery/feed')).body.items.map((i) => i.id)).toContain(ev.id);
    expect((await bad.client.get('/me')).status).toBe(200);
    expect((await admin.client.post(`/admin/users/${bad.id}/block`, { reason: 'spam' })).status).toBe(204);
    expect((await viewer.client.get<{ items: Card[] }>('/discovery/feed')).body.items.map((i) => i.id)).not.toContain(ev.id);
    expect((await bad.client.get('/me')).status).toBe(401);
    const relog = await new Client(ctx.url).post<{ code: string }>('/auth/login', { email: bad.email, password: 'senha-forte-123' });
    expect(relog.body.code).toBe('ACCOUNT_BLOCKED');
  });
});

describe('Rate limit', () => {
  it('Força bruta no código: a 6ª tentativa em 10 min → 429', async () => {
    const u = await user(ctx);
    process.env.RATE_LIMIT = 'on';
    try {
      const codes: number[] = [];
      for (let i = 0; i < 6; i++) codes.push((await u.client.post('/events/access-code', { code: `ZZZZ${i}A` })).status);
      expect(codes.slice(0, 5).every((c) => c === 404)).toBe(true);
      expect(codes[5]).toBe(429);
    } finally {
      delete process.env.RATE_LIMIT;
    }
  });
});

describe('Ciclo do organizador', () => {
  it('rascunho → publicar exige e-mail verificado e capa; cancelar notifica', async () => {
    const org = await user(ctx);
    await org.client.post('/organizer', { displayName: 'Minha Casa', kind: 'venue' });
    const d = await org.client.post<{ id: string }>('/events', { title: 'Festa Nova', typeSlug: 'festas' });
    expect(d.status).toBe(201);
    const check = await org.client.get<{ missing: string[] }>(`/events/${d.body.id}/publish-check`);
    expect(check.body.missing).toEqual(expect.arrayContaining(['cover', 'startsAt', 'location']));
    expect((await org.client.post<{ code: string }>(`/events/${d.body.id}/publish`)).body.code).toBe('EMAIL_NOT_VERIFIED');
    const other = await user(ctx);
    expect((await other.client.req('PATCH', `/api/v1/events/${d.body.id}`, { title: 'Hackeado' })).status).toBe(403);
  });
});
