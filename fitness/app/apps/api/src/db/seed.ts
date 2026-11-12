/**
 * Seed idempotente: catálogo de academias (São José dos Pinhais/PR) e personagens públicos de
 * demonstração com publicações, para a vitrine não nascer vazia. Personagens demo pertencem a
 * aparelhos "fantasma" cujo token ninguém conhece.
 */
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SHARE, type GoalId } from '@fitness/domain';
import pg from 'pg';
import { hashToken } from '../shared/auth';

export const GYMS = [
  {
    id: 'forja',
    name: 'Forja Fitness',
    neighborhood: 'Centro',
    lat: -25.534,
    lng: -49.206,
    modalities: ['Musculação', 'Funcional'],
    hours: '05:00–23:00',
  },
  {
    id: 'box41',
    name: 'Box 41 Calistenia',
    neighborhood: 'São Pedro',
    lat: -25.526,
    lng: -49.198,
    modalities: ['Calistenia', 'Mobilidade'],
    hours: '06:00–22:00',
  },
  {
    id: 'studio',
    name: 'Studio Pinhais',
    neighborhood: 'Cidade Jardim',
    lat: -25.548,
    lng: -49.217,
    modalities: ['Funcional', 'Pilates'],
    hours: '06:00–21:00',
  },
  {
    id: 'ponte',
    name: 'Academia Ponte Alta',
    neighborhood: 'Aristocrata',
    lat: -25.553,
    lng: -49.188,
    modalities: ['Musculação', 'Lutas'],
    hours: '05:30–23:00',
  },
  {
    id: 'arena',
    name: 'Arena Muscle',
    neighborhood: 'Afonso Pena',
    lat: -25.515,
    lng: -49.228,
    modalities: ['Musculação', 'Cross'],
    hours: '24 horas',
  },
] as const;

interface DemoChar {
  nick: string;
  color: number;
  gym: string;
  goal: GoalId;
  streak: number;
  workouts: number;
  prs: string[];
  achievements: string[];
  evolution: string | null;
}

const CHARS: DemoChar[] = [
  {
    nick: 'ana.calistenia',
    color: 2,
    gym: 'box41',
    goal: 'recomp',
    streak: 21,
    workouts: 148,
    prs: ['Barra fixa · 12 reps', 'Flexão · 40 reps'],
    achievements: ['100 treinos', '3 semanas seguidas'],
    evolution: null,
  },
  {
    nick: 'joao.ovoearroz',
    color: 3,
    gym: 'forja',
    goal: 'definicao',
    streak: 9,
    workouts: 64,
    prs: ['Supino · 70 kg'],
    achievements: ['Semana limpa', 'Proteína 7/7'],
    evolution: '−6,2 kg em 12 semanas',
  },
  {
    nick: 'bruno.medindo',
    color: 0,
    gym: 'studio',
    goal: 'definicao',
    streak: 14,
    workouts: 52,
    prs: [],
    achievements: ['Medida a cada 14 dias × 6'],
    evolution: '−4,0 cm de cintura em 8 semanas',
  },
  {
    nick: 'dani.agacha',
    color: 1,
    gym: 'arena',
    goal: 'hipertrofia',
    streak: 33,
    workouts: 211,
    prs: ['Agachamento · 90 kg', 'Terra · 110 kg'],
    achievements: ['200 treinos', 'Volume 1 t em uma sessão'],
    evolution: null,
  },
  {
    nick: 'marcos.supino',
    color: 4,
    gym: 'forja',
    goal: 'hipertrofia',
    streak: 5,
    workouts: 100,
    prs: ['Supino · 100 kg'],
    achievements: ['100 treinos'],
    evolution: '+3,1 kg em 16 semanas',
  },
  {
    nick: 'lu.recomp',
    color: 5,
    gym: 'ponte',
    goal: 'recomp',
    streak: 12,
    workouts: 77,
    prs: ['Desenvolvimento · 16 kg'],
    achievements: ['Proteína 7/7'],
    evolution: null,
  },
  {
    nick: 'tiago.bulking',
    color: 0,
    gym: 'arena',
    goal: 'hipertrofia',
    streak: 2,
    workouts: 18,
    prs: ['Remada · 50 kg'],
    achievements: ['Primeiro mês'],
    evolution: null,
  },
];

const POSTS: {
  nick: string;
  kind: string;
  title: string;
  values: [string, string][];
  pr?: string;
  achievement?: string;
  hoursAgo: number;
  kudos: number;
}[] = [
  {
    nick: 'ana.calistenia',
    kind: 'treino',
    title: 'Treino B · Calistenia',
    values: [
      ['Duração', '52 min'],
      ['Gasto', '410 kcal'],
      ['Streak', '21 dias'],
    ],
    pr: 'Barra fixa · 12 reps',
    hoursAgo: 2,
    kudos: 4,
  },
  {
    nick: 'joao.ovoearroz',
    kind: 'dieta',
    title: 'Meta da dieta cumprida',
    values: [
      ['Sequência', '7 dias'],
      ['Proteína', '7/7 dias'],
    ],
    achievement: 'Desafio “Semana limpa” concluído',
    hoursAgo: 3,
    kudos: 3,
  },
  {
    nick: 'bruno.medindo',
    kind: 'medida',
    title: 'Avaliação registrada',
    values: [
      ['Cintura', '−4 cm em 8 sem.'],
      ['Registros', '6 seguidos'],
    ],
    hoursAgo: 5,
    kudos: 5,
  },
  {
    nick: 'dani.agacha',
    kind: 'treino',
    title: 'Pernas pesadas',
    values: [
      ['Volume', '6.240 kg'],
      ['Gasto', '520 kcal'],
      ['Duração', '74 min'],
    ],
    pr: 'Agachamento · 90 kg',
    hoursAgo: 22,
    kudos: 6,
  },
  {
    nick: 'marcos.supino',
    kind: 'conquista',
    title: '100 treinos registrados',
    values: [
      ['Desde', 'jul/2026'],
      ['Streak', '5 dias'],
    ],
    achievement: 'Conquista “100 treinos”',
    hoursAgo: 26,
    kudos: 4,
  },
  {
    nick: 'lu.recomp',
    kind: 'treino',
    title: 'Treino A · Musculação',
    values: [
      ['Duração', '61 min'],
      ['Gasto', '380 kcal'],
      ['Volume', '4.120 kg'],
    ],
    hoursAgo: 30,
    kudos: 2,
  },
];

export async function seed(databaseUrl: string, log: (m: string) => void = console.log): Promise<void> {
  const db = new pg.Client({ connectionString: databaseUrl, options: '-c search_path=fitness,public' });
  await db.connect();
  try {
    await db.query('BEGIN');
    for (const g of GYMS) {
      await db.query(
        `INSERT INTO gyms (id, name, neighborhood, city, lat, lng, modalities, hours) VALUES ($1,$2,$3,'São José dos Pinhais',$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, neighborhood = EXCLUDED.neighborhood, lat = EXCLUDED.lat,
           lng = EXCLUDED.lng, modalities = EXCLUDED.modalities, hours = EXCLUDED.hours`,
        [g.id, g.name, g.neighborhood, g.lat, g.lng, g.modalities, g.hours],
      );
    }
    const ids = new Map<string, { characterId: string; deviceId: string }>();
    for (const c of CHARS) {
      const existing = await db.query<{ id: string; device_id: string }>(
        'SELECT id, device_id FROM characters WHERE nick = $1',
        [c.nick],
      );
      if (existing.rows[0]) continue;
      const dev = await db.query<{ id: string }>(
        "INSERT INTO devices (token_hash, fingerprint) VALUES ($1, 'seed') RETURNING id",
        [hashToken(randomBytes(32).toString('base64url'))],
      );
      const deviceId = dev.rows[0]?.id ?? '';
      const stats = {
        goal: c.goal,
        streak: c.streak,
        workouts: c.workouts,
        prs: c.prs,
        achievements: c.achievements,
        evolution: c.evolution,
      };
      const share = { ...DEFAULT_SHARE, evolucao: c.evolution !== null };
      const ch = await db.query<{ id: string }>(
        `INSERT INTO characters (device_id, nick, color, gym_id, opt_in, share, public_stats) VALUES ($1,$2,$3,$4,true,$5,$6) RETURNING id`,
        [deviceId, c.nick, c.color, c.gym, JSON.stringify(share), JSON.stringify(stats)],
      );
      ids.set(c.nick, { characterId: ch.rows[0]?.id ?? '', deviceId });
    }
    for (const p of POSTS) {
      const owner = ids.get(p.nick);
      if (!owner) continue;
      const post = await db.query<{ id: string }>(
        `INSERT INTO posts (character_id, kind, title, vals, pr, achievement, created_at)
         VALUES ($1,$2,$3,$4,$5,$6, now() - make_interval(hours => $7)) RETURNING id`,
        [owner.characterId, p.kind, p.title, JSON.stringify(p.values), p.pr ?? null, p.achievement ?? null, p.hoursAgo],
      );
      // apoios vindos de outros personagens demo
      const supporters = [...ids.values()].filter((x) => x.deviceId !== owner.deviceId).slice(0, p.kudos);
      for (const s of supporters) {
        await db.query('INSERT INTO kudos (post_id, device_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          post.rows[0]?.id,
          s.deviceId,
        ]);
      }
    }
    await db.query('COMMIT');
    log(`seed: ${GYMS.length} academias · ${ids.size} personagens novos`);
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    await db.end();
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL ausente');
  await seed(url);
}
