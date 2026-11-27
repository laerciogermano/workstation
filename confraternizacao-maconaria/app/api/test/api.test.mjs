// Testes de integração: sobem a API num banco separado (confrat_test) e exercitam as rotas por HTTP.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import pg from 'pg';
import { totp, totpStep, base32Encode } from '../dist/auth/crypto.js';

const PORT = 3999, BASE = `http://127.0.0.1:${PORT}/api`;
const url = new URL(process.env.DATABASE_URL); url.pathname = '/confrat_test';
const env = { ...process.env, DATABASE_URL: url.href, PORT: String(PORT), APP_ORIGIN: `http://localhost:${PORT}`, DEV_TOOLS: 'true' };
const PASSWORD = process.env.SEED_PASSWORD;
let server, db;

before(async () => {
  const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  if (!(await admin.query(`select 1 from pg_database where datname = 'confrat_test'`)).rowCount) await admin.query('create database confrat_test');
  await admin.end();
  execFileSync('node', ['dist/db/migrate.js', '--reset'], { env });
  execFileSync('node', ['dist/db/seed.js'], { env });
  server = spawn('node', ['dist/main.js'], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BASE}/auth/config`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
  db = new pg.Client({ connectionString: url.href }); await db.connect();
});
after(async () => { server?.kill(); await db?.end(); });

/** cliente com pote de cookies */
function client() {
  const jar = new Map();
  return async function call(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '), ...headers }, body: body && JSON.stringify(body) });
    for (const c of res.headers.getSetCookie()) { const [k, v] = c.split(';')[0].split('='); v ? jar.set(k, v) : jar.delete(k); }
    const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    return { status: res.status, data, setCookie: res.headers.getSetCookie() };
  };
}
async function login(email) {
  const c = client();
  const r = await c('POST', '/auth/login', { email, password: PASSWORD });
  assert.equal(r.status, 200);
  if (r.data.mfaRequired) assert.equal((await c('POST', '/auth/mfa/verify', { code: r.data.devCode })).status, 200);
  const events = (await c('GET', '/events')).data;
  const eventId = events.find((e) => e.slug === '125-anos').id;
  const ev = (method, path, body) => c(method, `/events/${eventId}${path}`, body);
  const context = (await ev('GET', '/context')).data;
  return { c, ev, eventId, attendeeId: context.me.attendeeId, context };
}
const session = async (u, title) => (await u.ev('GET', '/sessions')).data.find((s) => s.title.startsWith(title));

test('TOTP segue o vetor da RFC 6238 e não aceita reuso', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  assert.equal(totp(secret, 1), '287082');
  assert.equal(totpStep(secret, '287082', 0, 59_000), 1);
  assert.equal(totpStep(secret, '287082', 1, 59_000), null);
});

test('login: senha errada, MFA obrigatório e sessão só depois do código', async () => {
  const c = client();
  assert.equal((await c('POST', '/auth/login', { email: 'paulo.ribeiro@exemplo.com', password: 'errada-123' })).status, 401);
  assert.equal((await c('POST', '/auth/login', { email: 'ninguem@exemplo.com', password: PASSWORD })).status, 401);
  const r = await c('POST', '/auth/login', { email: 'paulo.ribeiro@exemplo.com', password: PASSWORD });
  assert.equal(r.data.mfaRequired, true);
  assert.equal((await c('GET', '/me')).status, 401);
  const wrong = r.data.devCode === '000000' ? '111111' : '000000';
  assert.match((await c('POST', '/auth/mfa/verify', { code: wrong })).data.message, /Restam 4/);
  // trocar de método não zera as tentativas
  const sms = await c('POST', '/auth/mfa/method', { method: 'sms' });
  assert.match((await c('POST', '/auth/mfa/verify', { code: sms.data.devCode === '000000' ? '111111' : '000000' })).data.message, /Restam 3/);
  const ok = await c('POST', '/auth/mfa/verify', { code: sms.data.devCode, trustDevice: true });
  assert.equal(ok.status, 200);
  assert.ok(ok.setCookie.some((x) => x.startsWith('cf_session=') && /HttpOnly/.test(x) && /SameSite=Strict/.test(x)));
  assert.equal((await c('GET', '/me')).status, 200);
  await c('POST', '/auth/logout');
  assert.equal((await c('POST', '/auth/login', { email: 'paulo.ribeiro@exemplo.com', password: PASSWORD })).data.mfaRequired, false, 'aparelho confiável');
  await c('DELETE', '/security/trusted-devices');
});

test('cinco códigos errados encerram o desafio', async () => {
  const c = client();
  const r = await c('POST', '/auth/login', { email: 'paulo.ribeiro@exemplo.com', password: PASSWORD });
  const wrong = r.data.devCode === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) assert.equal((await c('POST', '/auth/mfa/verify', { code: wrong })).status, 400);
  assert.equal((await c('POST', '/auth/mfa/verify', { code: wrong })).status, 429);
  assert.equal((await c('POST', '/auth/mfa/verify', { code: r.data.devCode })).status, 429);
});

test('cadastro, autenticador, códigos reserva e confirmação para desativar', async () => {
  const c = client();
  const body = { name: 'Teste Silva', email: 'teste@exemplo.com', password: 'senha-forte-1', obedience: 'Grande Loja', cim: '999' };
  assert.equal((await c('POST', '/auth/register', body)).status, 201);
  assert.equal((await client()('POST', '/auth/register', body)).status, 409);
  assert.equal((await client()('POST', '/auth/register', { ...body, email: 'x@exemplo.com', password: '123' })).status, 400);
  const setup = (await c('POST', '/security/setup', { method: 'app' })).data;
  assert.match(setup.qr, /^data:image\/png/);
  const step = Math.floor(Date.now() / 30_000);
  const activated = await c('POST', '/security/activate', { challengeId: setup.challengeId, code: totp(setup.secret, step) });
  assert.equal(activated.data.backupCodes.length, 8);
  const stored = await db.query(`select secret from mfa_factors f join users u on u.id = f.user_id where u.email = 'teste@exemplo.com'`);
  assert.ok(!stored.rows[0].secret.includes(setup.secret), 'segredo cifrado no banco');
  // mudar a segurança exige código recente
  assert.equal((await c('POST', '/security/disable')).status, 403);
  assert.equal((await c('POST', '/security/setup', { method: 'email' })).status, 403);

  const other = client();
  const l = await other('POST', '/auth/login', { email: body.email, password: body.password });
  assert.equal(l.data.method, 'app');
  assert.equal((await other('POST', '/auth/mfa/verify', { code: totp(setup.secret, step) })).status, 400, 'código já usado');
  await other('POST', '/auth/mfa/method', { method: 'backup' });
  assert.equal((await other('POST', '/auth/mfa/verify', { code: activated.data.backupCodes[0] })).status, 200);
  const again = client();
  await again('POST', '/auth/login', { email: body.email, password: body.password });
  await again('POST', '/auth/mfa/method', { method: 'backup' });
  assert.equal((await again('POST', '/auth/mfa/verify', { code: activated.data.backupCodes[0] })).status, 400, 'código reserva é de uso único');

  const up = (await c('POST', '/security/step-up', { method: 'backup' })).data;
  assert.equal((await c('POST', '/security/step-up/verify', { challengeId: up.challengeId, code: activated.data.backupCodes[1] })).status, 200);
  assert.equal((await c('POST', '/security/disable')).status, 200);
});

test('rotas exigem sessão e bloqueiam origem estranha', async () => {
  assert.equal((await client()('GET', '/events')).status, 401);
  const u = await login('roberto.almeida@exemplo.com');
  assert.equal((await u.c('PUT', '/me/consent', { analytics: true }, { origin: 'https://malicioso.example' })).status, 403);
});

test('autorização: papel, módulo desligado e evento alheio', async () => {
  const org = await login('paulo.ribeiro@exemplo.com'), rob = await login('roberto.almeida@exemplo.com'), ana = await login('ana.ribeiro@exemplo.com');
  assert.equal((await rob.ev('GET', '/modules')).status, 403);
  assert.equal((await rob.ev('GET', '/risks')).status, 403);
  assert.equal((await rob.ev('POST', '/auction/call')).status, 403);
  assert.equal((await rob.ev('POST', '/venues', { name: 'X x', address: 'Rua 1', capacity: 10 })).status, 403);
  assert.equal((await ana.ev('GET', '/auction')).status, 403, 'familiar não vê leilão');
  assert.equal((await ana.ev('GET', '/news')).status, 200);
  await org.ev('PUT', '/modules/museum', { enabled: false });
  assert.equal((await rob.ev('GET', '/museum')).status, 403);
  assert.equal((await org.ev('GET', '/museum')).status, 403, 'desligado vale para todos');
  await org.ev('PUT', '/modules/museum', { enabled: true });
  assert.equal((await rob.ev('GET', '/museum')).status, 200);
  await org.ev('PUT', '/modules/risks', { roles: ['organizer', 'attendee'] });
  assert.equal((await rob.ev('GET', '/risks')).status, 200, 'papel liberado vê');
  assert.equal((await rob.ev('POST', '/risks', { title: 'abc', level: 'low', ownerId: rob.attendeeId })).status, 403, 'mas não escreve');
  await org.ev('PUT', '/modules/risks', { roles: ['organizer'] });
  const draft = (await org.c('GET', '/events')).data.find((e) => e.status === 'draft');
  assert.equal((await rob.c('GET', `/events/${draft.id}/sessions`)).status, 403);
  assert.equal((await rob.c('POST', `/events/${draft.id}/join`)).status, 404);
  assert.ok(!(await rob.c('GET', '/events')).data.some((e) => e.id === draft.id));
  assert.equal((await rob.c('POST', '/events', { name: 'Outro encontro' })).status, 403);
});

test('IDOR: conversa, pedido e dados de outra pessoa', async () => {
  const paulo = await login('paulo.ribeiro@exemplo.com'), rob = await login('roberto.almeida@exemplo.com');
  const joao = (await paulo.ev('GET', '/chats')).data.direct.find((d) => d.title === 'João Ferreira');
  assert.equal((await rob.ev('GET', `/chats/${joao.id}/messages`)).status, 404);
  assert.equal((await rob.ev('POST', `/chats/${joao.id}/messages`, { body: 'oi' })).status, 404);
  const order = (await paulo.ev('GET', '/orders')).data[0];
  assert.equal((await rob.ev('GET', `/orders/${order.id}`)).status, 404);
  assert.equal((await rob.ev('POST', `/orders/${order.id}/simulate-payment`)).status, 404);
  const jantar = await session(rob, 'Jantar');
  assert.equal((await rob.ev('GET', `/chats/${jantar.chatId}/messages`)).status, 404, 'grupo exige inscrição');
  const people = (await rob.ev('GET', `/sessions/${jantar.id}/participants`)).data;
  assert.deepEqual(Object.keys(people[0]).sort(), ['city', 'id', 'lodge', 'me', 'name', 'obedience', 'photo']);
});

test('lotação: duas inscrições ao mesmo tempo não passam do limite', async () => {
  const a = await login('roberto.almeida@exemplo.com'), b = await login('paulo.ribeiro@exemplo.com');
  const tour = await session(a, 'Linha Turismo');
  assert.equal(tour.confirmed, tour.capacity);
  assert.equal((await a.ev('POST', `/sessions/${tour.id}/registration`)).status, 409);
  await db.query('update sessions set capacity = capacity + 1 where id = $1', [tour.id]);
  const res = await Promise.all([a, b].map((u) => u.ev('POST', `/sessions/${tour.id}/registration`)));
  assert.deepEqual(res.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await session(a, 'Linha Turismo')).confirmed, tour.capacity + 1);
});

test('check-in exige inscrição', async () => {
  const u = await login('roberto.almeida@exemplo.com');
  const jantar = await session(u, 'Jantar');
  assert.equal((await u.ev('POST', `/sessions/${jantar.id}/check-in`)).status, 400);
  await u.ev('POST', `/sessions/${jantar.id}/registration`);
  assert.equal((await u.ev('POST', `/sessions/${jantar.id}/check-in`)).status, 200);
  assert.equal((await session(u, 'Jantar')).checkedIn, true);
});

test('compra: preço vem do banco, pagamento inscreve e não repete', async () => {
  const u = await login('roberto.almeida@exemplo.com');
  const types = (await u.ev('GET', '/ticket-types')).data;
  const gala = types.find((t) => t.title.startsWith('Baile'));
  const created = await u.ev('POST', '/orders', { source: 'ticket', ticketTypeId: gala.id, quantity: 2, total: 1, unitPrice: 1 });
  assert.equal(created.status, 201);
  assert.equal((await u.ev('GET', `/orders/${created.data.id}`)).data.total, 700);
  const pays = await Promise.all([1, 2].map(() => u.ev('POST', `/orders/${created.data.id}/simulate-payment`)));
  assert.deepEqual(pays.map((p) => p.status).sort(), [200, 409]);
  assert.equal((await db.query('select count(*)::int as n from tickets where order_id = $1', [created.data.id])).rows[0].n, 2);
  const s = await session(u, 'Baile');
  assert.equal(s.registered, true);
  assert.equal((await u.ev('DELETE', `/sessions/${s.id}/registration`)).status, 409, 'ingresso pago não cancela sozinho');
  assert.equal((await u.ev('POST', '/orders', { source: 'ticket', ticketTypeId: gala.id, quantity: 99 })).status, 400);
});

test('leilão: fechado até ser chamado, lances em fila e venda ao maior', async () => {
  const org = await login('paulo.ribeiro@exemplo.com'), a = await login('roberto.almeida@exemplo.com'), b = await login('antonio.kowalski@exemplo.com');
  const lot = (await a.ev('GET', '/auction')).data.lots.find((l) => l.title.startsWith('Medalha'));
  assert.equal((await a.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 300 })).status, 409);
  assert.equal((await org.ev('POST', '/auction/call')).status, 200);
  const both = await Promise.all([a, b].map((u) => u.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 300 })));
  assert.deepEqual(both.map((r) => r.status).sort(), [201, 409], 'só um leva o mesmo valor');
  const [winner, loser] = both[0].status === 201 ? [a, b] : [b, a];
  assert.equal((await winner.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 400 })).status, 409, 'quem lidera não cobre a si mesmo');
  assert.equal((await loser.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 350 })).status, 409, 'abaixo do incremento');
  assert.equal((await loser.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 9_000_000 })).status, 409, 'valor absurdo');
  assert.equal((await loser.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 400 })).status, 201);
  assert.equal((await a.ev('POST', `/auction/lots/${lot.id}/close`)).status, a === org ? 200 : 403);
  assert.equal((await org.ev('POST', `/auction/lots/${lot.id}/close`)).status, 200);
  const order = (await loser.ev('GET', '/orders')).data.find((o) => o.source === 'auction');
  assert.equal(order.total, 400);
  assert.equal((await winner.ev('POST', `/auction/lots/${lot.id}/bids`, { amount: 500 })).status, 409);
});

test('tempo real: mensagem avisa só quem participa', async () => {
  const org = await login('paulo.ribeiro@exemplo.com'), rob = await login('roberto.almeida@exemplo.com');
  const chat = (await org.ev('POST', '/chats/direct', { attendeeId: rob.attendeeId })).data;
  assert.equal((await rob.ev('POST', `/chats/${chat.id}/messages`, { body: 'Olá' })).status, 201);
  assert.equal((await org.ev('GET', `/chats/${chat.id}/messages`)).data.messages.at(-1).body, 'Olá');
  assert.equal((await org.ev('POST', '/chats/direct', { attendeeId: org.attendeeId })).status, 400);
});

test('organização publica programação e novo evento do GOB', async () => {
  const org = await login('paulo.ribeiro@exemplo.com');
  const created = (await org.c('POST', '/events', { name: 'Encontro de teste', city: 'Maringá' })).data;
  assert.equal((await org.c('PATCH', `/events/${created.id}/publish`)).status, 409);
  const venue = (await org.c('POST', `/events/${created.id}/venues`, { name: 'Salão', address: 'Rua 1', capacity: 50 })).data;
  const s = await org.c('POST', `/events/${created.id}/sessions`, { title: 'Abertura', date: '2027-08-01', time: '19:30', venueId: venue.id, capacity: 40 });
  assert.equal(s.status, 201);
  assert.equal((await org.c('PATCH', `/events/${created.id}/publish`)).status, 200);
  const list = (await org.c('GET', `/events/${created.id}/sessions`)).data;
  assert.equal(new Date(list[0].startsAt).toISOString(), '2027-08-01T22:30:00.000Z');
  // local de outro evento não serve
  const foreign = (await org.ev('GET', '/venues')).data[0];
  assert.equal((await org.c('POST', `/events/${created.id}/sessions`, { title: 'Outra', date: '2027-08-01', time: '10:00', venueId: foreign.id, capacity: 4 })).status, 404);
});

test('excluir conta apaga dados pessoais e mantém lances anônimos', async () => {
  const u = await login('hernan.ruiz@exemplo.com');
  assert.equal((await u.c('DELETE', '/me', { password: 'errada-123' })).status, 400);
  assert.equal((await u.c('DELETE', '/me', { password: PASSWORD })).status, 200);
  assert.equal((await u.c('GET', '/me')).status, 401);
  assert.equal((await client()('POST', '/auth/login', { email: 'hernan.ruiz@exemplo.com', password: PASSWORD })).status, 401);
  const left = await db.query(`select u.name, u.email, (select count(*)::int from registrations r where r.attendee_id = a.id) as regs, (select count(*)::int from bids b where b.attendee_id = a.id) as bids
    from attendees a join users u on u.id = a.user_id where a.id = $1`, [u.attendeeId]);
  assert.equal(left.rows[0].name, 'Conta excluída');
  assert.equal(left.rows[0].regs, 0);
  assert.ok(left.rows[0].bids > 0);
});
