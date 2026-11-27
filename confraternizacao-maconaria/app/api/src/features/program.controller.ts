import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard, EventGuard, InModule, Member, Only, Uuid, Zod, found, text, type Membership } from '../common.js';
import { config } from '../config.js';
import { Db, type Queryable } from '../database.js';
import { Hub } from './realtime.js';
import { notify } from './notify.js';

const sessionBody = z.object({
  title: text(3, 140, 'Dê um título ao evento.'), description: text(0, 2000, 'Descrição longa demais.').default(''),
  date: z.iso.date('Informe o dia.'), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe o horário.'),
  venueId: z.uuid('Escolha o local.'), capacity: z.coerce.number().int().min(1, 'Informe as vagas.').max(100_000),
});
const venueBody = z.object({ name: text(2, 120, 'Preencha o nome do local.'), address: text(3, 200, 'Preencha o endereço do local.'), capacity: z.coerce.number().int().min(1, 'Informe a capacidade.').max(100_000) });

const SESSION_SQL = `select s.id, s.title, s.kind, s.description, s.starts_at, s.ends_at, s.capacity,
  v.id as venue_id, v.name as venue_name, v.address as venue_address, v.lat, v.lng,
  (select count(*) from registrations x where x.session_id = s.id) as confirmed,
  r.id is not null as registered, c.id is not null as checked_in, g.id as chat_id,
  (select min(price) from ticket_types t where t.session_id = s.id) as price
  from sessions s join venues v on v.id = s.venue_id
  left join registrations r on r.session_id = s.id and r.attendee_id = $2
  left join check_ins c on c.registration_id = r.id
  left join chats g on g.session_id = s.id
  where s.event_id = $1`;

/** inscreve respeitando a lotação; a linha da sessão fica travada até o fim da transação */
export async function register(q: Queryable, eventId: string, sessionId: string, attendeeId: string) {
  const s = found(await q.one<{ id: string; title: string; capacity: number }>('select id, title, capacity from sessions where id = $1 and event_id = $2 for update', [sessionId, eventId]), 'Evento não encontrado.');
  if (await q.one('select id from registrations where session_id = $1 and attendee_id = $2', [sessionId, attendeeId])) return false;
  const n = await q.one<{ n: number }>('select count(*) as n from registrations where session_id = $1', [sessionId]);
  if (n!.n >= s.capacity) throw new ConflictException('Vagas esgotadas.');
  await q.many('insert into registrations (session_id, attendee_id) values ($1,$2)', [sessionId, attendeeId]);
  await notify(q, [attendeeId], 'Inscrição confirmada', s.title, `/evento/${sessionId}`);
  return true;
}

@Controller('events/:eventId') @UseGuards(AuthGuard, EventGuard)
export class ProgramController {
  constructor(private db: Db, private hub: Hub) {}

  @Get('sessions')
  sessions(@Member() m: Membership) { return this.db.many(`${SESSION_SQL} order by s.starts_at, s.title`, [m.eventId, m.attendeeId]); }

  @Get('sessions/:id')
  async session(@Member() m: Membership, @Param('id', Uuid) id: string) {
    return found(await this.db.one(`${SESSION_SQL} and s.id = $3`, [m.eventId, m.attendeeId, id]), 'Evento não encontrado.');
  }

  @Post('sessions') @Only('organizer')
  async create(@Member() m: Membership, @Body(new Zod(sessionBody)) b: z.infer<typeof sessionBody>) {
    found(await this.db.one('select id from venues where id = $1 and event_id = $2', [b.venueId, m.eventId]), 'Local não encontrado.');
    return this.db.tx(async (q) => {
      const s = await q.one<{ id: string }>(
        `insert into sessions (event_id, venue_id, title, description, capacity, starts_at, ends_at)
         values ($1,$2,$3,$4,$5, ($6::date + $7::time) at time zone $8, ($6::date + $7::time) at time zone $8 + interval '2 hours') returning id`,
        [m.eventId, b.venueId, b.title, b.description, b.capacity, b.date, b.time, config.timeZone]);
      await q.many(`insert into chats (event_id, type, session_id) values ($1, 'group', $2)`, [m.eventId, s!.id]);
      await q.many(`update events set starts_on = least(coalesce(starts_on, $2::date), $2::date), ends_on = greatest(coalesce(ends_on, $2::date), $2::date) where id = $1`, [m.eventId, b.date]);
      return s;
    }).then((s) => { this.hub.publish(m.eventId, 'program'); return s; });
  }

  @Post('sessions/:id/registration')
  async enroll(@Member() m: Membership, @Param('id', Uuid) id: string) {
    await this.db.tx((q) => register(q, m.eventId, id, m.attendeeId));
    this.hub.publish(m.eventId, 'program');
    return { ok: true };
  }

  @Delete('sessions/:id/registration')
  async leave(@Member() m: Membership, @Param('id', Uuid) id: string) {
    const paid = await this.db.one('select t.id from tickets t join ticket_types tt on tt.id = t.ticket_type_id where tt.session_id = $1 and t.attendee_id = $2', [id, m.attendeeId]);
    if (paid) throw new ConflictException('Você tem ingresso pago. Fale com a organização para cancelar.');
    await this.db.many('delete from registrations r using sessions s where r.session_id = s.id and s.event_id = $1 and s.id = $2 and r.attendee_id = $3', [m.eventId, id, m.attendeeId]);
    this.hub.publish(m.eventId, 'program');
    return { ok: true };
  }

  @Post('sessions/:id/check-in') @HttpCode(200) @InModule('tickets')
  async checkIn(@Member() m: Membership, @Param('id', Uuid) id: string) {
    const r = await this.db.one<{ id: string }>('select r.id from registrations r join sessions s on s.id = r.session_id where s.event_id = $1 and s.id = $2 and r.attendee_id = $3', [m.eventId, id, m.attendeeId]);
    if (!r) throw new BadRequestException('Inscreva-se no evento antes do check-in.');
    await this.db.many('insert into check_ins (registration_id) values ($1) on conflict do nothing', [r.id]);
    return { ok: true };
  }

  /** CU-11: só nome, loja, potência e cidade */
  @Get('sessions/:id/participants')
  async participants(@Member() m: Membership, @Param('id', Uuid) id: string, @Query('q') q = '') {
    found(await this.db.one('select id from sessions where id = $1 and event_id = $2', [id, m.eventId]), 'Evento não encontrado.');
    const like = `%${String(q).slice(0, 80).replace(/[\\%_]/g, '\\$&')}%`;
    return this.db.many(`select a.id, u.name, a.lodge, a.obedience, u.city, u.photo, a.id = $3 as me
      from registrations r join attendees a on a.id = r.attendee_id join users u on u.id = a.user_id
      where r.session_id = $1 and u.deleted_at is null and concat_ws(' ', u.name, a.lodge, a.obedience, u.city) ilike $2
      order by u.name limit 100`, [id, like, m.attendeeId]);
  }

  @Get('venues')
  venues(@Member() m: Membership) { return this.db.many('select id, name, address, capacity, lat, lng from venues where event_id = $1 order by name', [m.eventId]); }

  @Post('venues') @Only('organizer')
  async venue(@Member() m: Membership, @Body(new Zod(venueBody)) b: z.infer<typeof venueBody>) {
    // sem serviço de geocodificação: o marcador fica perto do centro até alguém ajustar
    const jitter = () => (Math.random() - 0.5) * 0.04;
    return this.db.one('insert into venues (event_id, name, address, capacity, lat, lng) values ($1,$2,$3,$4,$5,$6) returning id',
      [m.eventId, b.name, b.address, b.capacity, -25.425 + jitter(), -49.275 + jitter()]);
  }
}
