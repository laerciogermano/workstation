/**
 * Integração com Postgres real (docker compose up -d db). Cada resposta é validada contra o
 * contrato Zod de @fitness/contracts (teste de contrato) e os casos citam RF/RN do PRD.
 */
import {
  BodyResponse,
  CreateDeviceResponse,
  DietDayResponse,
  ErrorBody,
  FeedResponse,
  GymDetailResponse,
  GymsResponse,
  MeResponse,
  MyCharacter,
  ProgressResponse,
  PublicProfileResponse,
  SearchResponse,
  TrainingDayResponse,
} from '@fitness/contracts';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ZodTypeAny } from 'zod';
import { buildApp } from '../src/app';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';
import type { Clock } from '../src/shared/clock';
import { type Db, createPool } from '../src/shared/db';

const URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgres://fitness:fitness@localhost:5433/fitness';
const TODAY = '2026-11-08'; // domingo → Treino A
const clock: Clock = { now: () => new Date(`${TODAY}T15:00:00Z`) };

let app: FastifyInstance;
let db: Db;
let token = '';
const nick = `t.${Date.now().toString(36)}`;

async function call(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, body?: unknown, auth = token) {
  const res = await app.inject({
    method,
    url,
    headers: auth ? { authorization: `Bearer ${auth}` } : {},
    ...(body !== undefined ? { payload: body as Record<string, unknown> } : {}),
  });
  return { status: res.statusCode, body: res.body ? (res.json() as unknown) : null };
}
const ok = <S extends ZodTypeAny>(schema: S, r: { status: number; body: unknown }) => {
  expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
  return schema.parse(r.body) as ReturnType<S['parse']>;
};
const errCode = (r: { body: unknown }) => ErrorBody.parse(r.body).error.code;

const profile = {
  sex: 'f',
  age: 31,
  heightCm: 168,
  weightKg: 72,
  activity: 'moderado',
  goal: 'definicao',
  magnitudePct: 20,
};

beforeAll(async () => {
  await migrate(URL, () => {});
  await seed(URL, () => {});
  db = createPool(URL);
  app = await buildApp({ db, clock, logLevel: 'silent' });
});
afterAll(async () => {
  await app?.close();
  await db?.end();
});

describe('identidade sem conta', () => {
  it('RF-01 · RF-02 · cria aparelho sem login e devolve token opaco', async () => {
    const r = ok(CreateDeviceResponse, await call('POST', '/v1/devices', { fingerprint: 'vitest' }, ''));
    token = r.token;
    const me = ok(MeResponse, await call('GET', '/v1/me'));
    expect(me.profile).toBeNull();
  });

  it('RF-04 · token desconhecido = aparelho novo', async () => {
    const r = await call('GET', '/v1/me', undefined, 'x'.repeat(43));
    expect(r.status).toBe(401);
    expect(errCode(r)).toBe('DEVICE_UNKNOWN');
  });
});

describe('onboarding e energia', () => {
  it('RN-02 · sem onboarding não há dieta', async () => {
    const r = await call('GET', `/v1/diet/${TODAY}`);
    expect(r.status).toBe(409);
    expect(errCode(r)).toBe('ONBOARDING_REQUIRED');
  });

  it('RN-16 · fora da faixa segura exige confirmação', async () => {
    const r = await call('PUT', '/v1/profile', { ...profile, magnitudePct: 30 });
    expect(r.status).toBe(422);
    expect(errCode(r)).toBe('EXTREME_NEEDS_CONFIRMATION');
  });

  it('RF-09 · RN-05 · salva perfil e calcula déficit', async () => {
    const r = await call('PUT', '/v1/profile', profile);
    expect(r.status).toBe(200);
    const me = ok(MeResponse, await call('GET', '/v1/me'));
    expect(me.energy?.strategy).toBe('deficit');
    expect(me.energy?.target).toBeLessThan(me.energy?.tdee ?? 0);
  });
});

describe('dieta pelo estoque', () => {
  it('RF-18 · RN-10 · plano só com o estoque', async () => {
    const d = ok(
      DietDayResponse,
      await call('PUT', '/v1/diet/pantry', {
        foodIds: ['ovo', 'frango', 'arroz', 'feijao', 'banana', 'azeite', 'pao', 'iogurte'],
      }),
    );
    for (const m of d.plan.meals) for (const i of m.items) expect(d.pantry).toContain(i.foodId);
  });

  it('RF-19 · estoque pobre avisa', async () => {
    const d = ok(DietDayResponse, await call('PUT', '/v1/diet/pantry', { foodIds: ['arroz', 'banana', 'azeite'] }));
    expect(d.plan.viable).toBe(false);
    ok(
      DietDayResponse,
      await call('PUT', '/v1/diet/pantry', {
        foodIds: ['ovo', 'frango', 'arroz', 'feijao', 'banana', 'azeite', 'pao', 'iogurte'],
      }),
    );
  });

  it('RF-20 · RF-21 · marcar refeições, extra e fechar o dia', async () => {
    for (const meal of ['cafe', 'almoco', 'lanche', 'jantar']) {
      ok(DietDayResponse, await call('PUT', `/v1/diet/${TODAY}/meals/${meal}`, { status: 'feito' }));
    }
    const d = ok(
      DietDayResponse,
      await call('POST', `/v1/diet/${TODAY}/extras`, { name: 'Brigadeiro', kcal: 110, p: 1, c: 18, g: 4 }),
    );
    expect(d.extras).toHaveLength(1);
    const close = await call('POST', `/v1/diet/${TODAY}/close`);
    expect(close.status).toBe(200);
  });

  it('não grava fora de hoje/ontem', async () => {
    const r = await call('PUT', '/v1/diet/2026-10-01/meals/cafe', { status: 'feito' });
    expect(errCode(r)).toBe('DAY_OUT_OF_RANGE');
  });
});

describe('treino', () => {
  it('RF-25 · RF-27 · marcar séries, concluir e somar kcal', async () => {
    let t = ok(TrainingDayResponse, await call('GET', `/v1/training/${TODAY}`));
    expect(t.sessionId).toBe('A');
    t = ok(
      TrainingDayResponse,
      await call('PUT', `/v1/training/${TODAY}/exercises/agachamento`, { setsDone: 4, loadKg: 55 }),
    );
    expect(t.summary.done).toContain('agachamento');
    expect(t.summary.kcal).toBeGreaterThan(0);
    const bad = await call('PUT', `/v1/training/${TODAY}/exercises/barra`, { setsDone: 1 });
    expect(errCode(bad)).toBe('NOT_IN_SESSION');
    const c = await call('POST', `/v1/training/${TODAY}/complete`, { publish: true });
    expect(c.status).toBe(200);
  });
});

describe('corpo e progresso', () => {
  it('RF-29 · RN-07 · medida nova recalcula a meta', async () => {
    const r = await call('PUT', `/v1/body/measurements/${TODAY}`, {
      weightKg: 71.5,
      waistCm: 80,
      hipCm: 100,
      chestCm: 93,
      armCm: 30,
      thighCm: 57,
    });
    expect(r.status).toBe(200);
    const b = ok(BodyResponse, await call('GET', '/v1/body'));
    expect(b.measurements).toHaveLength(1);
  });

  it('RF-16 · RF-33 · progresso com projeção, streak e insights', async () => {
    const p = ok(ProgressResponse, await call('GET', `/v1/progress/${TODAY}`));
    expect(p.projection).toHaveLength(13);
    expect(p.streak).toBe(1);
    expect(p.insights.length).toBeGreaterThan(0);
  });
});

describe('vitrine, personagens e academias', () => {
  it('RF-37 · feed tem publicações demo', async () => {
    const f = ok(FeedResponse, await call('GET', '/v1/social/feed'));
    expect(f.posts.length).toBeGreaterThan(0);
  });

  it('RF-42 · RN-17 · cria personagem com vitrine desligada por padrão', async () => {
    const c = ok(
      MyCharacter,
      await call('POST', '/v1/social/character', { nick, color: 1, gymId: 'forja', optIn: false }),
    );
    expect(c.share.peso).toBe(false);
    const dup = await call('POST', '/v1/social/character', {
      nick: 'ana.calistenia',
      color: 1,
      gymId: null,
      optIn: true,
    });
    expect(dup.status).toBe(409);
  });

  it('RN-19 · busca só encontra personagem público', async () => {
    let s = ok(SearchResponse, await call('GET', `/v1/social/characters?q=${nick}`));
    expect(s.characters).toHaveLength(0);
    ok(MyCharacter, await call('PATCH', '/v1/social/character', { optIn: true }));
    s = ok(SearchResponse, await call('GET', `/v1/social/characters?q=${nick}`));
    expect(s.characters[0]?.mine).toBe(true);
  });

  it('RN-18 · perfil público não expõe evolução sem toggle', async () => {
    const p = ok(PublicProfileResponse, await call('GET', `/v1/social/characters/${nick}`));
    expect(p.stats.evolution).toBeNull();
    expect(p.stats.workouts).toBe(1);
  });

  it('RF-41 · apoio em publicação de outra pessoa', async () => {
    const f = ok(FeedResponse, await call('GET', '/v1/social/feed'));
    const other = f.posts.find((x) => !x.mine);
    if (!other) throw new Error('sem post demo');
    const r = await call('POST', `/v1/social/posts/${other.id}/kudos`);
    expect((r.body as { kudoed: boolean }).kudoed).toBe(true);
  });

  it('RF-47 · RF-50 · academias por proximidade e detalhe', async () => {
    const g = ok(GymsResponse, await call('GET', '/v1/gyms?lat=-25.5347&lng=-49.2063'));
    expect(g.gyms[0]?.id).toBe('forja');
    expect(g.gyms[0]?.distanceKm).not.toBeNull();
    const t = ok(GymsResponse, await call('GET', '/v1/gyms?q=calistenia'));
    expect(t.gyms.map((x) => x.id)).toContain('box41');
    const d = ok(GymDetailResponse, await call('GET', '/v1/gyms/forja'));
    expect(d.people.map((x) => x.nick)).toContain(nick);
  });

  it('RNF-01 · apagar dados remove tudo do aparelho', async () => {
    expect((await call('DELETE', '/v1/me')).status).toBe(204);
    expect((await call('GET', '/v1/me')).status).toBe(401);
  });
});
