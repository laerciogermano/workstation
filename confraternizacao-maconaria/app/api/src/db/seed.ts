/** Dados de exemplo, os mesmos do protótipo. Só para desenvolvimento. */
import pg from 'pg';
import { config } from '../config.js';
import { hashPassword, token } from '../auth/crypto.js';
import { defaultModules } from '../modules.js';

if (config.production && process.env.ALLOW_SEED !== 'true') {
  throw new Error('O seed de exemplo não roda em produção (use ALLOW_SEED=true só no demo Contabo)');
}
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) throw new Error('Defina SEED_PASSWORD com pelo menos 8 caracteres');

const db = new pg.Client({ connectionString: config.databaseUrl });
await db.connect();
if ((await db.query('select 1 from events limit 1')).rowCount) {
  console.log('banco já tem dados; seed ignorado (use pnpm db:reset para recomeçar)');
  await db.end();
  process.exit(0);
}
await db.query('begin');
const id = async (sql: string, params: unknown[] = []) => (await db.query(`${sql} returning id`, params)).rows[0].id as string;
const run = (sql: string, params: unknown[] = []) => db.query(sql, params);
const hash = await hashPassword(password);
const at = (day: number, time: string) => `2027-04-${day}T${time}:00-03:00`;

const org = await id(`insert into organizations (name, acronym) values ('Grande Oriente do Brasil', 'GOB')`);
const modules = defaultModules();
for (const k of ['tickets', 'orders', 'news', 'vouchers', 'parking', 'museum'] as const) modules[k].roles.push('family');
const event = await id(`insert into events (organization_id, name, slug, starts_on, ends_on, city, status, modules) values ($1, 'Confraternização 125 anos', '125-anos', '2027-04-22', '2027-04-25', 'Curitiba', 'published', $2)`, [org, modules]);

// ---------- pessoas ----------
async function person(email: string | null, name: string, city: string, lodge: string, obedience: string, roles = ['attendee'], extra: { country?: string; cim?: string; office?: string; phone?: string } = {}) {
  const user = await id('insert into users (email, password_hash, name, city, country, phone) values ($1,$2,$3,$4,$5,$6)',
    [email ?? `convidado-${token().slice(0, 12).toLowerCase()}@exemplo.invalid`, email ? hash : '', name, city, extra.country ?? 'Brasil', extra.phone ?? '']);
  const attendee = await id('insert into attendees (event_id, user_id, lodge, obedience, cim, office, roles) values ($1,$2,$3,$4,$5,$6,$7)', [event, user, lodge, obedience, extra.cim ?? '', extra.office ?? '', roles]);
  return { user, attendee };
}
const paulo = await person('paulo.ribeiro@exemplo.com', 'Paulo Ribeiro', 'Curitiba, PR', 'Loja Luz do Iguaçu nº 41', 'GOB-PR · Grande Oriente do Paraná', ['attendee', 'organizer', 'auctioneer'], { cim: '12.345', office: 'Mestre Instalado', phone: '(41) 99999-0000' });
await run(`update users set mfa_enabled = true, mfa_method = 'email' where id = $1`, [paulo.user]);
await run(`insert into mfa_factors (user_id, method) values ($1, 'email'), ($1, 'sms')`, [paulo.user]);
const joao = await person('joao.ferreira@exemplo.com', 'João Ferreira', 'Lisboa, Portugal', 'Loja Acácia nº 12', 'Potência estrangeira', ['attendee'], { country: 'Portugal' });
const roberto = await person('roberto.almeida@exemplo.com', 'Roberto Almeida', 'Londrina, PR', 'Loja Norte do Paraná nº 18', 'GOB-PR');
const michael = await person('michael.grant@exemplo.com', 'Michael Grant', 'Edimburgo, Escócia', 'Lodge Thistle nº 7', 'Potência estrangeira', ['attendee'], { country: 'Outro' });
const antonio = await person('antonio.kowalski@exemplo.com', 'Antônio Kowalski', 'Curitiba, PR', 'Loja Luz do Iguaçu nº 41', 'GOB-PR');
const hernan = await person('hernan.ruiz@exemplo.com', 'Hernán Ruiz', 'Montevidéu, Uruguai', 'Logia del Plata nº 9', 'Potência estrangeira', ['attendee'], { country: 'Uruguai' });
const sergio = await person('sergio.tavares@exemplo.com', 'Sérgio Tavares', 'Ponta Grossa, PR', 'Loja Campos Gerais nº 23', 'GOB-PR');
const marcos = await person('marcos.bittencourt@exemplo.com', 'Marcos Bittencourt', 'Florianópolis, SC', 'Loja Ilha da Concórdia nº 30', 'Grande Loja');
const luiz = await person('luiz.prado@exemplo.com', 'Luiz Carlos Prado', 'São Paulo, SP', 'Loja Piratininga nº 55', 'GOB · outro estado');
await person('ana.ribeiro@exemplo.com', 'Ana Ribeiro', 'Curitiba, PR', '', '', ['family']);
const first = ['Carlos', 'Eduardo', 'Fernando', 'Gustavo', 'Henrique', 'Júlio', 'Márcio', 'Nelson', 'Otávio', 'Rafael', 'Vítor', 'Augusto'];
const last = ['Andrade', 'Barros', 'Camargo', 'Duarte', 'Esteves', 'Fontoura', 'Gouveia', 'Leal', 'Moraes', 'Nogueira'];
const cities = ['Curitiba, PR', 'Maringá, PR', 'Cascavel, PR', 'Joinville, SC', 'Porto Alegre, RS', 'Campinas, SP'];
const guests: string[] = [];
for (let i = 0; i < 90; i++) guests.push((await person(null, `${first[i % first.length]} ${last[(i + Math.floor(i / 60)) % last.length]}`, cities[i % cities.length], `Loja ${['Fraternidade', 'União', 'Harmonia', 'Concórdia'][i % 4]} nº ${60 + (i % 25)}`, i % 5 ? 'GOB-PR' : 'Grande Loja')).attendee);

// ---------- locais, salas e programação ----------
const venue = async (name: string, address: string, cap: number, lat: number, lng: number) => id('insert into venues (event_id, name, address, capacity, lat, lng) values ($1,$2,$3,$4,$5,$6)', [event, name, address, cap, lat, lng]);
const temple = await venue('Templo sede', 'Rua XV de Novembro, Centro', 500, -25.4296, -49.2691);
const guaira = await venue('Teatro Guaíra', 'Praça Santos Andrade, Centro', 2100, -25.4278, -49.2652);
const felicidade = await venue('Santa Felicidade', 'Av. Manoel Ribas, Santa Felicidade', 800, -25.4020, -49.3300);
const tiradentes = await venue('Praça Tiradentes', 'Ponto da Linha Turismo, Centro', 120, -25.4297, -49.2719);
const mon = await venue('Museu Oscar Niemeyer', 'Rua Mal. Hermes, 999, Centro Cívico', 450, -25.4101, -49.2671);
const opera = await venue('Ópera de Arame', 'Rua João Gava, 970, Abranches', 1500, -25.3847, -49.2762);
const barigui = await venue('Parque Barigui', 'Av. Cândido Hartmann, Bigorrilho', 300, -25.4236, -49.3086);
const botanico = await venue('Jardim Botânico', 'Rua Eng. Ostoja Roguski, Jardim Botânico', 80, -25.4430, -49.2399);
const expo = await venue('Expo Barigui', 'Rua Prof. Pedro V. Parigot de Souza, Mossunguê', 1600, -25.4390, -49.3180);
const room = (v: string, name: string, cap: number, note: string | null = null) => id('insert into rooms (venue_id, name, capacity, reserved_note) values ($1,$2,$3,$4)', [v, name, cap, note]);
const salao = await room(temple, 'Salão nobre', 500, 'Reservada pela organização');
await room(temple, 'Sala de comissões', 40);
const auditorio = await room(mon, 'Auditório', 450, 'Reservada pela organização');
await room(expo, 'Sala de imprensa', 25);

type S = [string, number, string, string, number, string, string, number, string, string | null];
const program: S[] = [
  ['e1', 22, '09:00', '12:00', 22, 'Credenciamento e café de boas-vindas', temple, 500, 'Recepção|Retirada de credenciais e kits das delegações. Café servido no salão nobre, com recepção dos irmãos vindos de fora do país.', salao],
  ['e2', 22, '15:00', '18:30', 22, 'Sessão magna de abertura', guaira, 2100, 'Sessão|Abertura oficial das comemorações dos 125 anos, com a presença das potências convidadas e das delegações estrangeiras. Traje: terno escuro.', null],
  ['e3', 22, '20:00', '23:30', 22, 'Jantar de confraternização', felicidade, 800, 'Jantar|Jantar típico no bairro italiano de Curitiba, aberto a irmãos e cunhadas. O ônibus sai do Teatro Guaíra às 19:15.', null],
  ['e4', 23, '09:30', '12:30', 23, 'Linha Turismo com as delegações', tiradentes, 40, 'Passeio|Percurso pelos principais pontos da cidade em ônibus reservado, com guia bilíngue.', null],
  ['e5', 23, '14:00', '17:00', 23, 'Painel: 125 anos de história', mon, 450, 'Painel|Historiadores e ex-grão-mestres revisitam a fundação, os templos e as figuras que marcaram a potência no Paraná.', auditorio],
  ['e6', 23, '19:30', '21:30', 23, 'Concerto comemorativo', opera, 1500, 'Cultura|Orquestra convidada apresenta repertório preparado para o aniversário, com abertura pelo coral das lojas.', null],
  ['e7', 24, '08:00', '10:00', 24, 'Caminhada no Barigui', barigui, 300, 'Família|Caminhada leve de 3 km em volta do lago, com café ao final. Aberta a familiares.', null],
  ['e8', 24, '10:30', '12:00', 24, 'Visita guiada ao Jardim Botânico', botanico, 40, 'Família|Grupo reduzido, com guia. Ponto de encontro em frente à estufa.', null],
  ['e9', 24, '21:00', '02:00', 25, 'Baile de gala dos 125 anos', expo, 1600, 'Gala|Noite de gala com orquestra ao vivo. Traje: black tie. Mesas organizadas por delegação.', null],
  ['e10', 25, '11:00', '12:30', 25, 'Sessão de encerramento', temple, 500, 'Sessão|Encerramento solene, entrega de medalhas comemorativas e leitura da carta dos 125 anos.', null],
];
const sessions: Record<string, string> = {}, chats: Record<string, string> = {};
for (const [key, d, start, end, endDay, title, v, cap, kindDesc, roomId] of program) {
  const [kind, description] = kindDesc.split('|');
  sessions[key] = await id('insert into sessions (event_id, venue_id, room_id, title, description, kind, starts_at, ends_at, capacity) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [event, v, roomId, title, description, kind, at(d, start), at(endDay, end), cap]);
  chats[key] = await id(`insert into chats (event_id, type, session_id) values ($1, 'group', $2)`, [event, sessions[key]]);
}
const enroll = (a: string, key: string) => run('insert into registrations (session_id, attendee_id) values ($1,$2) on conflict do nothing', [sessions[key], a]);
for (const k of ['e2', 'e3', 'e5']) await enroll(paulo.attendee, k);
for (const a of [antonio, hernan, roberto, joao, michael]) await enroll(a.attendee, 'e2');
for (const a of [sergio, marcos]) await enroll(a.attendee, 'e3');
await enroll(luiz.attendee, 'e5'); await enroll(michael.attendee, 'e6');
const share: Record<string, number> = { e1: 38, e2: 61, e3: 44, e5: 33, e6: 52, e7: 18, e9: 47, e10: 25 };
for (const [key, n] of Object.entries(share)) for (let i = 0; i < n; i++) await enroll(guests[(i * 7 + key.length * 11 + i) % guests.length], key);
for (const a of guests.slice(0, 40)) await enroll(a, 'e4');   // lotado
for (const a of guests.slice(20, 56)) await enroll(a, 'e8');  // restam poucas
for (const [key, price] of [['e3', 150], ['e6', 80], ['e9', 350]] as const) await run(`insert into ticket_types (event_id, session_id, name, price) values ($1,$2,'Individual',$3)`, [event, sessions[key], price]);

// ---------- conversas ----------
const message = (chat: string, author: string, body: string, ago: string) => run('insert into messages (chat_id, author_id, body, sent_at) values ($1,$2,$3, now() - $4::interval)', [chat, author, body, ago]);
await message(chats.e2, antonio.attendee, 'Bom dia, irmãos. Os portões do Guaíra abrem às 14:00.', '3 hours');
await message(chats.e2, hernan.attendee, 'La delegación uruguaya llega al aeropuerto a las 11. ¿Hay traslado?', '150 minutes');
await message(chats.e2, antonio.attendee, 'Há sim, Ir. Hernán. Van na saída do desembarque, com placa do evento.', '140 minutes');
await message(chats.e2, roberto.attendee, 'Alguém de Londrina indo de carro? Sobram duas vagas.', '2 hours');
await message(chats.e3, sergio.attendee, 'Ônibus sai do Guaíra às 19:15 em ponto.', '27 hours');
await message(chats.e3, marcos.attendee, 'As cunhadas podem sentar na mesa da delegação?', '26 hours');
await message(chats.e5, luiz.attendee, 'Vou levar fotos do templo antigo para o painel.', '4 days');
await run('insert into chat_members (chat_id, attendee_id, last_read_at) values ($1,$2,now())', [chats.e5, paulo.attendee]);
async function direct(other: string, lines: [boolean, string, string][], read: boolean) {
  const chat = await id(`insert into chats (event_id, type, direct_key) values ($1,'direct',$2)`, [event, [paulo.attendee, other].sort().join(':')]);
  await run(`insert into chat_members (chat_id, attendee_id, last_read_at) values ($1,$2, case when $4 then now() else 'epoch'::timestamptz end), ($1,$3, now())`, [chat, paulo.attendee, other, read]);
  for (const [mine, body, ago] of lines) await message(chat, mine ? paulo.attendee : other, body, ago);
  return chat;
}
const joaoChat = await direct(joao.attendee, [[false, 'Paulo, chego quinta cedo. Podemos nos encontrar no credenciamento?', '100 minutes']], false);
await direct(michael.attendee, [[true, 'Welcome to Curitiba, brother! Let me know if you need anything.', '3 days'], [false, 'Thank you, Paulo. Looking forward to the concert at the Ópera de Arame.', '71 hours']], true);
await direct(roberto.attendee, [[false, 'Fechado, te pego no hotel às 14:15.', '4 days']], true);

// ---------- loja, leilão e serviços ----------
for (const [name, description, icon, price] of [['Medalha comemorativa', 'Série dos 125 anos, com estojo.', 'medal', 180], ['Livro dos 125 anos', 'Capa dura, 240 páginas.', 'book-open', 120], ['Gravata oficial', 'Edição do evento.', 'shirt', 90], ['Pin de lapela', 'Metal esmaltado.', 'badge', 35]])
  await run('insert into products (event_id, name, description, icon, price, stock) values ($1,$2,$3,$4,$5,50)', [event, name, description, icon, price]);
const auction = await id(`insert into auctions (event_id, venue_id, title, scheduled_at) values ($1,$2,'Leilão beneficente dos 125 anos',$3)`, [event, expo, at(24, '16:00')]);
const lot = async (title: string, description: string, start: number, bids: [{ attendee: string }, number][], sold = false) => {
  const l = await id('insert into lots (auction_id, title, description, starting_bid, status, winner_id, created_at) values ($1,$2,$3,$4,$5,$6, clock_timestamp())', [auction, title, description, start, sold ? 'sold' : 'open', sold ? bids.at(-1)![0].attendee : null]);
  for (const [who, amount] of bids) await run('insert into bids (lot_id, attendee_id, amount) values ($1,$2,$3)', [l, who.attendee, amount]);
  return l;
};
await lot('Avental histórico, edição 1902', 'Peça restaurada, doada por uma loja de Paranaguá. Acompanha certificado.', 500, [[hernan, 1500], [roberto, 1800]]);
await lot('Quadro “Templo de Salomão”, óleo sobre tela', 'Obra de 80 x 60 cm de artista paranaense, doada para o acervo.', 800, [[luiz, 2000], [michael, 2400]]);
await lot('Jantar para 8 com o Grão-Mestre', 'Mesa reservada no baile de gala, com os convidados do comprador.', 1000, [[antonio, 3200]]);
await lot('Medalha comemorativa nº 001', 'Primeira medalha numerada da série dos 125 anos.', 300, []);
const atas = await lot('Livro de atas, edição de 1950', 'Reedição fac-símile, encadernada à mão.', 400, [[sergio, 500], [paulo, 650]], true);
const order = await id(`insert into orders (event_id, attendee_id, source, total, ref_id) values ($1,$2,'auction',650,$3)`, [event, paulo.attendee, atas]);
await run(`insert into order_items (order_id, seq, description, quantity, unit_price, ref_id) values ($1,1,'Livro de atas, edição de 1950',1,650,$2)`, [order, atas]);

const voucher = (a: string, title: string, place: string, day: string, status = 'available') => run('insert into vouchers (attendee_id, title, place, valid_on, status, code) values ($1,$2,$3,$4,$5,$6)', [a, title, place, day, status, `VCH-${token().slice(0, 12)}`]);
await voucher(paulo.attendee, 'Café de boas-vindas', 'Templo sede', '2027-04-22');
await voucher(paulo.attendee, 'Almoço das delegações', 'Santa Felicidade', '2027-04-24');
await voucher(paulo.attendee, 'Coquetel de credenciamento', 'Templo sede', '2027-04-21', 'used');
await voucher(roberto.attendee, 'Almoço das delegações', 'Santa Felicidade', '2027-04-24');
const area = (v: string, period: string, cap: number) => id('insert into parking_areas (event_id, venue_id, period, capacity) values ($1,$2,$3,$4)', [event, v, period, cap]);
const spot = (areaId: string, a: string) => run(`insert into parking_spots (event_id, area_id, attendee_id, code) values ($1,$2,$3,$4)`, [event, areaId, a, `V-${token().slice(0, 5).toUpperCase()}`]);
await area(guaira, '22/04, 14h às 19h', 38);
await spot(await area(felicidade, '22/04, 19h30 às 0h', 13), paulo.attendee);
const full = await area(opera, '23/04, 18h30 às 22h', 5);
for (const a of guests.slice(0, 5)) await spot(full, a);
await area(expo, '24/04, 20h às 2h', 140);
for (const who of [paulo, roberto]) {
  const ms = await id(`insert into memberships (attendee_id, status, valid_until) values ($1,'good_standing','2027-12-31')`, [who.attendee]);
  await run(`insert into membership_payments (membership_id, title, amount, due_on, paid_at) values ($1,'Anuidade 2027 · 1ª parcela',480,'2026-11-10',now()), ($1,'Anuidade 2027 · 2ª parcela',480,'2027-06-10',null)`, [ms]);
}
for (const [title, total, parts, paid] of [['Van do aeroporto', 240, 6, false], ['Presente da loja às delegações', 900, 30, true]] as const) {
  const c = await id('insert into cost_shares (event_id, title, total, parts) values ($1,$2,$3,$4)', [event, title, total, parts]);
  await run('insert into cost_share_members (cost_share_id, attendee_id, amount, is_paid) values ($1,$2,$3,$4)', [c, paulo.attendee, total / parts, paid]);
}
for (const [who, name, industry] of [[roberto, 'Almeida Contabilidade', 'Serviços contábeis'], [antonio, 'Kowalski Engenharia', 'Obras e restauro'], [sergio, 'Tavares Transportes', 'Fretamento e vans'], [luiz, 'Prado Editora', 'Livros e memória']] as const)
  await run('insert into network_companies (event_id, attendee_id, name, industry) values ($1,$2,$3,$4)', [event, who.attendee, name, industry]);
for (const [title, body, ago] of [['Credenciamento abre às 9h na quinta', 'Leve documento com foto e a carteirinha do app. O ponto fica no Templo sede.', '1 hour'], ['Ônibus para o jantar sai do Guaíra às 19:15', 'As vagas são por ordem de inscrição no evento. Cunhadas são bem-vindas.', '1 day'], ['Leilão beneficente terá 5 lotes', 'A renda vai para o acervo da potência. O leiloeiro chama o leilão no sábado, às 16h.', '4 days']])
  await run('insert into news (event_id, title, body, published_at) values ($1,$2,$3, now() - $4::interval)', [event, title, body, ago]);
for (const [title, body, target, ago] of [['Leilão beneficente no sábado', 'O leiloeiro vai chamar às 16h na Expo Barigui.', '/leilao', '1 hour'], ['João Ferreira mandou uma mensagem', 'Paulo, chego quinta cedo.', `/chat/${joaoChat}`, '100 minutes'], ['Inscrição confirmada', 'Sessão magna de abertura', `/evento/${sessions.e2}`, '4 days']])
  await run('insert into notifications (attendee_id, title, body, target, created_at) values ($1,$2,$3,$4, now() - $5::interval)', [paulo.attendee, title, body, target, ago]);
for (const [category, icon, title, year, location, temp, hum, state, security] of [['Documentos', 'scroll-text', 'Ata de fundação', 1902, 'Reserva técnica', 19, 48, 'ok', 'Cofre com registro de acesso'], ['Joias', 'gem', 'Joia de Venerável Mestre', 1911, 'Em exposição', 21, 50, 'ok', 'Vitrine com alarme e câmera'], ['Selos', 'stamp', 'Coleção de selos comemorativos', 1922, 'Reserva técnica', 24, 63, 'attention', 'Armário trancado'], ['Imóveis', 'building', 'Templo histórico', 1904, 'Patrimônio', null, null, 'ok', 'Vigilância 24 h']])
  await run('insert into collection_items (event_id, category, icon, title, year, location, temperature, humidity, conservation, security) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [event, category, icon, title, year, location, temp, hum, state, security]);
for (const [title, level, owner, plan, status] of [['Chuva na caminhada do Barigui', 'medium', sergio, 'Mover o café para área coberta.', 'open'], ['Lotação do concerto', 'high', antonio, 'Controle de entrada por ingresso.', 'open'], ['Atraso do ônibus do jantar', 'low', roberto, 'Veículo reserva.', 'resolved']] as const)
  await run('insert into risks (event_id, title, level, owner_id, plan, status) values ($1,$2,$3,$4,$5,$6)', [event, title, level, owner.attendee, plan, status]);
await run(`insert into support_tickets (event_id, attendee_id, subject, message, status) values ($1,$2,'Troca de nome no ingresso','Preciso trocar o nome do acompanhante.','answered')`, [event, paulo.attendee]);

// segundo evento do GOB, ainda sem programação
const other = await id(`insert into events (organization_id, name, slug, city, modules) values ($1,'Encontro de lojas do Paraná','encontro-lojas-pr','Londrina',$2)`, [org, defaultModules()]);
await run(`insert into attendees (event_id, user_id, lodge, obedience, cim, roles) select $1, user_id, lodge, obedience, cim, '{organizer}' from attendees where id = $2`, [other, paulo.attendee]);

await db.query('commit');
await db.end();
console.log(`seed pronto. Contas de exemplo (senha em SEED_PASSWORD): paulo.ribeiro@exemplo.com, roberto.almeida@exemplo.com, ana.ribeiro@exemplo.com`);
