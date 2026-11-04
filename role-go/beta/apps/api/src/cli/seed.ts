/**
 * Seed determinístico (docs/05 §7): catálogo, Curitiba live + cidades "em breve", 1 admin, organizadores,
 * ~60 eventos em 0–40 km nos próximos 21 dias (10 privados, 8 encerrados com avaliações).
 * Uso: pnpm db:seed            (dados realistas)
 *      pnpm db:seed --big      (+10 mil eventos sintéticos para EXPLAIN/k6)
 */
import { hash } from '@node-rs/argon2';
import { sql } from 'drizzle-orm';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createDb, createPool, type Db } from '../shared/db/db';
import { runMigrations } from '../shared/db/migrate';
import { discoveryPreferences, events, interests, organizers, reviews, rsvps, users } from '../shared/db/schema';
import { env } from '../shared/env';
import { newId, slugify } from '../shared/kernel/ids';
import { MediaService } from '../shared/media/media.service';
import { LocalDiskStorage } from '../shared/media/storage';

const SEED_PASSWORD = 'rolego2026';

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261104);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)] as T;
const jitter = (v: number, amt: number) => v + (rnd() - 0.5) * amt;

const EVENT_TYPES = [
  { slug: 'festas', label: 'Festas', accent: 'magenta' },
  { slug: 'eletronica', label: 'Eletrônica', accent: 'cyan' },
  { slug: 'samba-pagode', label: 'Samba e pagode', accent: 'yellow' },
  { slug: 'sertanejo', label: 'Sertanejo', accent: 'yellow' },
  { slug: 'rock-indie', label: 'Rock e indie', accent: 'magenta' },
  { slug: 'bar', label: 'Bar e happy hour', accent: 'green' },
  { slug: 'shows', label: 'Shows', accent: 'violet' },
  { slug: 'cultura', label: 'Cultura e arte', accent: 'cyan' },
  { slug: 'gastronomia', label: 'Gastronomia', accent: 'green' },
  { slug: 'social', label: 'Social e churrasco', accent: 'yellow' },
] as const;

const CITIES = [
  { slug: 'curitiba', name: 'Curitiba', uf: 'PR', lat: -25.4284, lng: -49.2733, status: 'live' },
  { slug: 'florianopolis', name: 'Florianópolis', uf: 'SC', lat: -27.5954, lng: -48.548, status: 'soon' },
  { slug: 'porto-seguro', name: 'Porto Seguro', uf: 'BA', lat: -16.4435, lng: -39.0643, status: 'soon' },
  { slug: 'maringa', name: 'Maringá', uf: 'PR', lat: -23.4205, lng: -51.9333, status: 'soon' },
  { slug: 'sao-paulo', name: 'São Paulo', uf: 'SP', lat: -23.5505, lng: -46.6333, status: 'soon' },
] as const;

const PLACES = [
  { n: 'Centro', lat: -25.4296, lng: -49.2713, street: 'Rua XV de Novembro', cep: '80020-310' },
  { n: 'Largo da Ordem', lat: -25.4275, lng: -49.2722, street: 'Rua Dr. Claudino dos Santos', cep: '80020-300' },
  { n: 'Batel', lat: -25.442, lng: -49.289, street: 'Avenida do Batel', cep: '80420-090' },
  { n: 'Água Verde', lat: -25.452, lng: -49.285, street: 'Rua Brasílio Itiberê', cep: '80240-060' },
  { n: 'São Francisco', lat: -25.425, lng: -49.278, street: 'Rua Trajano Reis', cep: '80510-220' },
  { n: 'Mercês', lat: -25.427, lng: -49.295, street: 'Rua Padre Anchieta', cep: '80410-030' },
  { n: 'Rebouças', lat: -25.443, lng: -49.265, street: 'Rua Desembargador Westphalen', cep: '80230-100' },
  { n: 'Juvevê', lat: -25.415, lng: -49.26, street: 'Rua Augusto Stresser', cep: '80030-040' },
  { n: 'Bigorrilho', lat: -25.435, lng: -49.3, street: 'Rua Padre Anchieta', cep: '80730-000' },
  { n: 'Santa Felicidade', lat: -25.398, lng: -49.33, street: 'Avenida Manoel Ribas', cep: '82020-000' },
  { n: 'Portão', lat: -25.473, lng: -49.296, street: 'Avenida República Argentina', cep: '80610-260' },
  { n: 'Boqueirão', lat: -25.505, lng: -49.24, street: 'Rua Professor Guido Straube', cep: '81730-000' },
  { n: 'São José dos Pinhais', lat: -25.535, lng: -49.206, street: 'Rua XV de Novembro', cep: '83005-000' },
  { n: 'Colombo', lat: -25.292, lng: -49.224, street: 'Rua XV de Novembro', cep: '83414-000' },
  { n: 'Araucária', lat: -25.593, lng: -49.41, street: 'Avenida Victor do Amaral', cep: '83702-040' },
  { n: 'Campo Largo', lat: -25.459, lng: -49.528, street: 'Rua Centenário', cep: '83601-000' },
] as const;

type Org = { key: string; name: string; kind: 'person' | 'bar' | 'venue' | 'producer'; bio: string; ig: string; email: string | null; userName: string | null };
const ORGS: Org[] = [
  { key: 'club', name: 'Club Central', kind: 'venue', bio: 'Casa noturna no coração de Curitiba. Eletrônica e festas de quinta a sábado.', ig: 'clubcentral', email: 'club@rolego.dev', userName: 'Club Central' },
  { key: 'bar', name: 'Bar da Esquina', kind: 'bar', bio: 'Happy hour, samba e chope gelado desde 2015.', ig: 'bardaesquina', email: 'bar@rolego.dev', userName: 'Bar da Esquina' },
  { key: 'neon', name: 'Produtora Neon', kind: 'producer', bio: 'Festivais e festas temáticas em Curitiba e região.', ig: 'produtoraneon', email: 'neon@rolego.dev', userName: 'Produtora Neon' },
  { key: 'host', name: 'Laércio', kind: 'person', bio: 'Churrasco + som na laje. Só gente boa.', ig: 'laercio', email: 'laercio@rolego.dev', userName: 'Laércio' },
  { key: 'garagem', name: 'Garagem Indie', kind: 'venue', bio: 'Rock, indie e bandas autorais.', ig: 'garagemindie', email: 'garagem@rolego.dev', userName: 'Garagem Indie' },
  { key: 'aurora', name: 'Casa Aurora', kind: 'venue', bio: 'Espaço cultural com shows, teatro e exposições.', ig: 'casaaurora', email: null, userName: null },
];

type Tpl = { title: string; type: (typeof EVENT_TYPES)[number]['slug']; org: string; hours: number; startHour: number; prices: { label: string; priceCents: number | null; note?: string }[]; age: 'free' | '16' | '18'; desc: string; venue: string };
const TEMPLATES: Tpl[] = [
  { title: 'Neon Pulse Festival', type: 'eletronica', org: 'neon', hours: 8, startHour: 22, age: '18', venue: 'Club Central', prices: [{ label: 'Pista', priceCents: 8900, note: '1º lote' }, { label: 'VIP', priceCents: 18900 }, { label: 'Open bar até 00h', priceCents: null }], desc: 'Três DJs internacionais, palco 360° e projeções. Open bar até meia-noite no lote VIP. Proibida a entrada de menores de 18 anos.' },
  { title: 'Samba da Feira', type: 'samba-pagode', org: 'bar', hours: 6, startHour: 16, age: 'free', venue: 'Largo da Ordem', prices: [], desc: 'Roda de samba ao ar livre com os clássicos. Traga sua cadeira.' },
  { title: 'Sexta Eletrônica', type: 'eletronica', org: 'club', hours: 6, startHour: 23, age: '18', venue: 'Club Central', prices: [{ label: 'Antecipado', priceCents: 4000 }, { label: 'Na porta', priceCents: 6000 }], desc: 'House e techno até o sol nascer.' },
  { title: 'Happy Hour do Chope', type: 'bar', org: 'bar', hours: 4, startHour: 18, age: '18', venue: 'Bar da Esquina', prices: [{ label: 'Chope 300 ml', priceCents: 990, note: 'até 20h' }], desc: 'Chope em dobro até as 20h e petiscos da casa.' },
  { title: 'Indie na Garagem', type: 'rock-indie', org: 'garagem', hours: 5, startHour: 21, age: '16', venue: 'Garagem Indie', prices: [{ label: 'Entrada', priceCents: 3000 }], desc: 'Três bandas autorais de Curitiba. Discotecagem indie depois dos shows.' },
  { title: 'Sertanejo Universitário', type: 'sertanejo', org: 'neon', hours: 6, startHour: 22, age: '18', venue: 'Arena Sul', prices: [{ label: 'Pista', priceCents: 5000 }, { label: 'Camarote', priceCents: 12000 }], desc: 'Os hits do momento com duas duplas e DJ.' },
  { title: 'Sunset no Terraço', type: 'festas', org: 'club', hours: 5, startHour: 17, age: '18', venue: 'Terraço Central', prices: [{ label: 'Entrada', priceCents: 3500 }], desc: 'Pôr do sol com vista da cidade, drinks autorais e DJ set.' },
  { title: 'Jazz na Aurora', type: 'shows', org: 'aurora', hours: 3, startHour: 20, age: 'free', venue: 'Casa Aurora', prices: [{ label: 'Inteira', priceCents: 6000 }, { label: 'Meia', priceCents: 3000 }], desc: 'Quarteto de jazz instrumental com convidados.' },
  { title: 'Feira Gastronômica', type: 'gastronomia', org: 'aurora', hours: 8, startHour: 11, age: 'free', venue: 'Casa Aurora', prices: [], desc: 'Food trucks, cervejas artesanais e música ao vivo.' },
  { title: 'Exposição Luz e Cor', type: 'cultura', org: 'aurora', hours: 8, startHour: 10, age: 'free', venue: 'Casa Aurora', prices: [], desc: 'Instalações interativas de artistas locais.' },
  { title: 'Baile Funk Retrô', type: 'festas', org: 'neon', hours: 6, startHour: 23, age: '18', venue: 'Galpão 13', prices: [{ label: 'Pista', priceCents: 4500 }], desc: 'Só os clássicos dos anos 2000.' },
  { title: 'Pagode de Domingo', type: 'samba-pagode', org: 'bar', hours: 6, startHour: 15, age: 'free', venue: 'Bar da Esquina', prices: [{ label: 'Couvert', priceCents: 1500 }], desc: 'Pagode raiz com feijoada até as 17h.' },
  { title: 'Rock dos Anos 80', type: 'rock-indie', org: 'garagem', hours: 5, startHour: 22, age: '18', venue: 'Garagem Indie', prices: [{ label: 'Entrada', priceCents: 2500 }], desc: 'Banda cover e discotecagem oitentista.' },
  { title: 'Stand-up na Casa', type: 'cultura', org: 'aurora', hours: 2, startHour: 21, age: '16', venue: 'Casa Aurora', prices: [{ label: 'Ingresso', priceCents: 5000 }], desc: 'Quatro comediantes, uma noite.' },
];
const PRIVATE_TEMPLATES = [
  { title: 'Social do Laércio', desc: 'Churrasco + som na laje. Traga sua bebida.', type: 'social' as const, cap: 40, mode: 'manual' as const, discoverable: true },
  { title: 'Aniversário na Laje', desc: 'Festa de aniversário com DJ e bolo. Só convidados.', type: 'festas' as const, cap: 30, mode: 'manual' as const, discoverable: false },
  { title: 'Churras dos Amigos', desc: 'Churrasco de domingo. Aprovação automática para quem tem o código.', type: 'social' as const, cap: 25, mode: 'auto' as const, discoverable: true },
];

const PEOPLE = ['Ana Souza', 'Marina Lopes', 'João Pedro', 'Lucas Martins', 'Beatriz Alves', 'Thiago Rocha', 'Rafaela Lima', 'Bruno Costa', 'Juliana Prado', 'Felipe Ramos', 'Camila Duarte', 'Gustavo Reis', 'Larissa Melo', 'Pedro Henrique', 'Isabela Nunes', 'Mateus Silva', 'Carolina Dias', 'Diego Fernandes', 'Letícia Moura', 'Vinícius Teixeira'];
const COMMENTS = ['Rolê incrível, já quero a próxima!', 'Som muito bom e galera animada.', 'Fila grande na entrada, mas valeu.', 'Melhor festa do mês.', 'Ambiente top, drinks caros.', null, 'Voltaria com certeza.', null];

const GRADIENTS = [
  ['#0a0420', '#FF1F7A', '#8749FF'],
  ['#200000', '#FF1F7A', '#FFCC00'],
  ['#452EFF', '#8749FF', '#FF1F7A'],
  ['#1c1206', '#FFCC00', '#FF1F7A'],
  ['#0d0d10', '#00E5E5', '#FF1F7A'],
  ['#05062a', '#FFCC00', '#3a0b3e'],
  ['#001a1a', '#00E5E5', '#452EFF'],
] as const;

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function posterSvg(title: string, i: number): string {
  const [bg, a, b] = GRADIENTS[i % GRADIENTS.length] ?? GRADIENTS[0];
  // o título é sobreposto pela UI (como no protótipo); só fundo + degradês, sem formas.
  void title;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
  <defs>
    <radialGradient id="g1" cx="${30 + (i * 17) % 50}%" cy="${25 + (i * 11) % 30}%" r="60%"><stop offset="0" stop-color="${a}" stop-opacity=".95"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="${70 - (i * 13) % 40}%" cy="${60 + (i * 7) % 25}%" r="55%"><stop offset="0" stop-color="${b}" stop-opacity=".9"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="${bg}"/><rect width="1080" height="1350" fill="url(#g1)"/><rect width="1080" height="1350" fill="url(#g2)"/>
  <rect width="1080" height="1350" fill="url(#fade)"/></svg>`;
}

function avatarSvg(initial: string, i: number): string {
  const [bg, a] = GRADIENTS[(i + 3) % GRADIENTS.length] ?? GRADIENTS[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/><text x="256" y="330" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="230" fill="#fff">${xml(initial)}</text></svg>`;
}

const png = (svg: string) => sharp(Buffer.from(svg)).png().toBuffer();
const point = (lat: number, lng: number) => sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

async function truncate(db: Db): Promise<void> {
  await db.execute(sql`TRUNCATE share_clicks, reports, reviews, rsvps, interests, swipe_passes, event_media, events, event_series,
    organizers, discovery_preferences, auth_tokens, passkeys, refresh_tokens, audit_log, geocode_cache, users, media_assets, cities, event_types CASCADE`);
  await rm(path.resolve(env().MEDIA_DIR), { recursive: true, force: true });
}

async function main(): Promise<void> {
  const big = process.argv.includes('--big');
  const pool = createPool(env().DATABASE_URL);
  const db = createDb(pool);
  await runMigrations(db);
  await truncate(db);
  const media = new MediaService(db, new LocalDiskStorage());
  const now = new Date();
  const day = 86400_000;

  // catálogo
  for (const [i, t] of EVENT_TYPES.entries()) await db.execute(sql`INSERT INTO event_types (slug, label, accent, sort) VALUES (${t.slug}, ${t.label}, ${t.accent}, ${i})`);
  const cityId: Record<string, string> = {};
  for (const c of CITIES) {
    const id = newId();
    cityId[c.slug] = id;
    await db.execute(sql`INSERT INTO cities (id, slug, name, uf, center, timezone, launch_status) VALUES (${id}, ${c.slug}, ${c.name}, ${c.uf}, ${point(c.lat, c.lng)}, 'America/Sao_Paulo', ${c.status})`);
  }
  const ctb = cityId['curitiba'] ?? '';

  const passwordHash = await hash(SEED_PASSWORD, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const mkUser = async (email: string, name: string, i: number, role: 'user' | 'admin' = 'user', onboarded = true, opts?: { photo?: boolean }) => {
    const id = newId();
    // Sem fotos baixadas da internet: iniciais (SVG) ou sem foto.
    let photoAssetId: string | null = null;
    if (opts?.photo !== false) {
      const up = await media.upload('avatar', null, await png(avatarSvg(name.charAt(0), i)));
      photoAssetId = up.ok ? up.value.id : null;
    }
    await db.insert(users).values({
      id, email, name, passwordHash, role, status: 'active', showPresence: i % 7 !== 3,
      emailVerifiedAt: now, adultDeclaredAt: now, termsAcceptedAt: now, termsVersion: '2026-11-beta',
      photoAssetId, createdAt: new Date(now.getTime() - (30 + i) * day),
    });
    await db.insert(discoveryPreferences).values({
      userId: id, eventTypeSlugs: [pick(EVENT_TYPES).slug, pick(EVENT_TYPES).slug], cityId: ctb, originMode: 'city', radiusKm: 20, filters: {},
      onboardedAt: onboarded ? now : null,
    });
    return id;
  };

  const adminId = await mkUser('admin@rolego.dev', 'Admin RoleGo', 0, 'admin');
  const people: string[] = [];
  for (const [i, n] of PEOPLE.entries()) people.push(await mkUser(i === 0 ? 'ana@rolego.dev' : `${slugify(n).replace(/-/g, '.')}@rolego.dev`, n, i + 1));

  const orgId: Record<string, string> = {};
  for (const [i, o] of ORGS.entries()) {
    const userId = o.email && o.userName ? await mkUser(o.email, o.userName, 30 + i) : null;
    const avatar = await media.upload('avatar', userId, await png(avatarSvg(o.name.charAt(0), 40 + i)));
    const id = newId();
    orgId[o.key] = id;
    await db.insert(organizers).values({
      id, userId, slug: slugify(o.name), displayName: o.name, kind: o.kind, bio: o.bio, instagram: o.ig,
      avatarAssetId: avatar.ok ? avatar.value.id : null, contactEmail: o.email ?? 'contato@casaaurora.dev', claimedAt: userId ? now : null,
    });
  }

  type Ins = typeof events.$inferInsert;
  let n = 0;
  const createEvent = async (e: Omit<Ins, 'id' | 'slug' | 'coverAssetId' | 'timezone' | 'interestsCount' | 'goingCount' | 'pendingCount' | 'viewsCount' | 'ratingSum' | 'ratingCount' | 'location'> & { lat: number; lng: number }) => {
    const id = newId();
    const cover = await media.upload('cover', null, await png(posterSvg(e.title, n)));
    const { lat, lng, ...rest } = e;
    await db.insert(events).values({
      ...rest, id, slug: `${slugify(e.title)}-${(n + 1).toString(36).padStart(3, '0')}`, coverAssetId: cover.ok ? cover.value.id : null,
      timezone: 'America/Sao_Paulo', interestsCount: 0, goingCount: 0, pendingCount: 0, viewsCount: Math.floor(rnd() * 400), ratingSum: 0, ratingCount: 0,
      location: point(lat, lng),
    });
    n++;
    return id;
  };
  const at = (dayOffset: number, hour: number) => {
    const d = new Date(now.getTime() + dayOffset * day);
    // hora local de Curitiba (UTC-3)
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour + 3, 0));
  };

  // 49 públicos futuros (inclui 1 ao vivo agora) + 8 encerrados
  const publicIds: string[] = [];
  for (let i = 0; i < 49; i++) {
    const t = TEMPLATES[i % TEMPLATES.length] ?? TEMPLATES[0];
    if (!t) continue;
    const place = PLACES[i % PLACES.length] ?? PLACES[0];
    const live = i === 1;
    const startsAt = live ? new Date(now.getTime() - 2 * 3600_000) : at(Math.floor(i / 2.4), t.startHour);
    const effectiveStart = startsAt.getTime() <= now.getTime() && !live ? at(Math.floor(i / 2.4) + 1, t.startHour) : startsAt;
    const edition = i >= TEMPLATES.length ? ` #${Math.floor(i / TEMPLATES.length) + 1}` : '';
    publicIds.push(
      await createEvent({
        organizerId: orgId[t.org] ?? '', title: `${t.title}${edition}`, typeSlug: t.type, description: t.desc, ageRating: t.age,
        startsAt: effectiveStart, endsAt: new Date(effectiveStart.getTime() + t.hours * 3600_000),
        venueName: t.venue, street: place.street, number: String(100 + Math.floor(rnd() * 1800)), neighborhood: place.n, cep: place.cep,
        cityId: ctb, cityName: 'Curitiba', uf: 'PR', lat: jitter(place.lat, 0.01), lng: jitter(place.lng, 0.01),
        visibility: 'public', privateDiscoverable: false, approvalMode: 'manual', capacity: i % 9 === 4 ? 3 : null,
        priceItems: t.prices, externalTicketUrl: t.prices.length && i % 2 === 0 ? 'https://exemplo.com.br/ingressos' : null,
        status: 'published', publishedAt: new Date(now.getTime() - 3 * day),
      }),
    );
  }

  // 10 privados
  const privateIds: { id: string; code: string; title: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const t = PRIVATE_TEMPLATES[i % PRIVATE_TEMPLATES.length] ?? PRIVATE_TEMPLATES[0];
    if (!t) continue;
    const place = PLACES[(i * 3) % 12] ?? PLACES[0];
    const startsAt = at(2 + i * 2, 20);
    const code = `PRV${String.fromCharCode(65 + i)}${i + 2}K`.slice(0, 6).replace(/[01IOL]/g, 'X');
    const title = i < PRIVATE_TEMPLATES.length ? t.title : `${t.title} #${Math.floor(i / PRIVATE_TEMPLATES.length) + 1}`;
    privateIds.push({
      id: await createEvent({
        organizerId: orgId['host'] ?? '', title, typeSlug: t.type, description: `${t.desc} Capacidade: ${t.cap} pessoas.`, ageRating: '18',
        startsAt, endsAt: new Date(startsAt.getTime() + 6 * 3600_000), venueName: 'Casa do anfitrião', street: place.street, number: String(200 + i * 37),
        complement: 'Casa 2', neighborhood: place.n, cep: place.cep, cityId: ctb, cityName: 'Curitiba', uf: 'PR', lat: jitter(place.lat, 0.008), lng: jitter(place.lng, 0.008),
        visibility: 'private', privateDiscoverable: t.discoverable, approvalMode: t.mode, accessCode: code, capacity: t.cap, priceItems: [],
        externalTicketUrl: null, status: 'published', publishedAt: now,
      }),
      code,
      title,
    });
  }

  // 8 encerrados com avaliações (2 na janela de avaliação da Ana)
  const ended: string[] = [];
  for (let i = 0; i < 8; i++) {
    const t = TEMPLATES[(i * 2) % TEMPLATES.length] ?? TEMPLATES[0];
    if (!t) continue;
    const place = PLACES[i % PLACES.length] ?? PLACES[0];
    const startsAt = i < 2 ? new Date(now.getTime() - (i + 1) * day - 6 * 3600_000) : at(-(i * 4 + 9), t.startHour);
    ended.push(
      await createEvent({
        organizerId: orgId[t.org] ?? '', title: `${t.title} — edição passada ${i + 1}`, typeSlug: t.type, description: t.desc, ageRating: t.age,
        startsAt, endsAt: new Date(startsAt.getTime() + Math.min(t.hours, 5) * 3600_000), venueName: t.venue, street: place.street, number: '500',
        neighborhood: place.n, cep: place.cep, cityId: ctb, cityName: 'Curitiba', uf: 'PR', lat: place.lat, lng: place.lng,
        visibility: 'public', privateDiscoverable: false, approvalMode: 'manual', capacity: null, priceItems: t.prices, externalTicketUrl: null,
        status: 'published', publishedAt: new Date(startsAt.getTime() - 7 * day),
      }),
    );
  }

  // série: o Neon Pulse futuro + edições passadas com galeria
  const seriesId = newId();
  await db.execute(sql`INSERT INTO event_series (id, organizer_id, name) VALUES (${seriesId}, ${orgId['neon'] ?? ''}, 'Neon Pulse Festival')`);
  const firstPublic = publicIds[0];
  const firstEnded = ended[0];
  if (firstPublic && firstEnded) {
    await db.execute(sql`UPDATE events SET series_id = ${seriesId} WHERE id IN (${firstPublic}, ${firstEnded})`);
    for (let g = 0; g < 4; g++) {
      const up = await media.upload('gallery', null, await png(posterSvg(['Pista lotada', 'Palco 360', 'DJ set', 'Até o sol'][g] ?? 'Foto', g + 3)));
      if (up.ok) await db.execute(sql`INSERT INTO event_media (event_id, asset_id, position) VALUES (${firstEnded}, ${up.value.id}, ${g})`);
    }
  }

  // engajamento: interesses, confirmações, pedidos e avaliações
  const ana = people[0] ?? '';
  const addInterest = async (u: string, e: string) => {
    await db.insert(interests).values({ userId: u, eventId: e }).onConflictDoNothing();
  };
  const addRsvp = async (u: string, e: string, status: 'confirmed' | 'approved' | 'pending') => {
    await db.insert(rsvps).values({ id: newId(), eventId: e, userId: u, status, decidedAt: status === 'pending' ? null : now }).onConflictDoNothing();
    if (status !== 'pending') await addInterest(u, e);
  };
  for (const [i, e] of publicIds.entries()) {
    const capped = i % 9 === 4;
    const goers = capped ? 3 : Math.floor(rnd() * 12);
    for (let k = 0; k < goers; k++) await addRsvp(people[(i + k * 3) % people.length] ?? ana, e, 'confirmed');
    for (let k = 0; k < Math.floor(rnd() * 10); k++) await addInterest(people[(i * 2 + k) % people.length] ?? ana, e);
  }
  for (const [i, p] of privateIds.entries()) {
    for (let k = 1; k < 6; k++) await addRsvp(people[(i + k) % people.length] ?? ana, p.id, 'approved');
    for (let k = 6; k < 9; k++) await addRsvp(people[(i + k) % people.length] ?? ana, p.id, 'pending');
  }
  for (const [i, e] of ended.entries()) {
    for (let k = 0; k < 8; k++) {
      const u = people[(i + k) % people.length] ?? ana;
      if (i < 2 && u === ana) continue;
      await addRsvp(u, e, 'confirmed');
      const c = COMMENTS[(i + k) % COMMENTS.length];
      if (k < 6) await db.insert(reviews).values({ id: newId(), eventId: e, userId: u, rating: 3 + ((i + k) % 3), comment: c ?? null, status: 'visible' }).onConflictDoNothing();
    }
    if (i < 2) await addRsvp(ana, e, 'confirmed'); // "Como foi?" pendente para a Ana
  }

  // contadores denormalizados a partir dos dados
  await db.execute(sql`UPDATE events e SET
    going_count = (SELECT count(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed','approved')),
    pending_count = (SELECT count(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'pending'),
    interests_count = (SELECT count(*) FROM interests i WHERE i.event_id = e.id),
    rating_sum = coalesce((SELECT sum(rating) FROM reviews v WHERE v.event_id = e.id AND v.status = 'visible'), 0),
    rating_count = (SELECT count(*) FROM reviews v WHERE v.event_id = e.id AND v.status = 'visible')`);

  // rascunho do Club Central
  await db.insert(events).values({
    id: newId(), organizerId: orgId['club'] ?? '', slug: 'rascunho-noite-latina-001', title: 'Noite Latina', typeSlug: 'festas', description: '', ageRating: '18',
    timezone: 'America/Sao_Paulo', venueName: 'Club Central', neighborhood: '', cityName: '', visibility: 'public', privateDiscoverable: false, approvalMode: 'manual',
    priceItems: [], status: 'draft', interestsCount: 0, goingCount: 0, pendingCount: 0, viewsCount: 0, ratingSum: 0, ratingCount: 0,
  });

  if (big) {
    const cover = await media.upload('cover', null, await png(posterSvg('Carga', 1)));
    const coverId = cover.ok ? cover.value.id : null;
    const orgList = Object.values(orgId);
    const types = EVENT_TYPES.map((t) => t.slug);
    for (let b = 0; b < 20; b++) {
      const values = [];
      for (let k = 0; k < 500; k++) {
        const i = b * 500 + k;
        const start = new Date(now.getTime() + (1 + (i % 60)) * day / 2);
        values.push(sql`(${newId()}, ${orgList[i % orgList.length] ?? ''}, ${`carga-${i}`}, ${`Evento sintético ${i}`}, ${types[i % types.length] ?? 'festas'}, ${coverId},
          ${start}, ${new Date(start.getTime() + 4 * 3600_000)}, 'Local sintético', 'Centro', ${ctb}, 'Curitiba',
          ${point(jitter(-25.4284, 1.2), jitter(-49.2733, 1.2))}, 'public', 'published')`);
      }
      await db.execute(sql`INSERT INTO events (id, organizer_id, slug, title, type_slug, cover_asset_id, starts_at, ends_at, venue_name, neighborhood, city_id, city_name, location, visibility, status) VALUES ${sql.join(values, sql`, `)}`);
    }
    console.log('+10.000 eventos sintéticos');
  }

  await pool.end();
  console.log(`seed ok: ${n} eventos, ${people.length + ORGS.length} usuários. Senha de todos: ${SEED_PASSWORD}`);
  console.log(`  ana@rolego.dev (usuária) · admin@rolego.dev (admin) · club@rolego.dev / laercio@rolego.dev (organizadores)`);
  console.log('  capas: degradê sem círculos; avatares: só iniciais (sem fotos da internet)');
  console.log(`  códigos privados: ${privateIds.slice(0, 3).map((p) => `${p.title}=${p.code}`).join(' · ')}`);
  void adminId;
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
