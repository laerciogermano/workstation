import { Body, ConflictException, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import QRCode from 'qrcode';
import { z } from 'zod';
import { AuthGuard, EventGuard, InModule, Member, Uuid, Zod, found, text, type Membership } from '../common.js';
import { config } from '../config.js';
import { Db } from '../database.js';

const ticketBody = z.object({ subject: text(3, 120, 'Preencha o assunto.'), message: text(3, 2000, 'Preencha a mensagem.') });
const joinBody = z.object({ name: text(2, 120, 'Informe seu nome.'), city: text(0, 80, 'Cidade inválida.').default(''), contact: text(5, 120, 'Informe um contato.') });

@Controller('events/:eventId') @UseGuards(AuthGuard, EventGuard)
export class ServicesController {
  constructor(private db: Db) {}

  @Get('vouchers') @InModule('vouchers')
  async vouchers(@Member() m: Membership) {
    const rows = await this.db.many<{ code: string; status: string }>('select id, title, place, valid_on, status, code from vouchers where attendee_id = $1 order by status, valid_on', [m.attendeeId]);
    return Promise.all(rows.map(async ({ code, ...v }) => ({ ...v, qr: v.status === 'available' ? await QRCode.toDataURL(code, { margin: 1, width: 336 }) : null })));
  }

  @Get('parking') @InModule('parking')
  parking(@Member() m: Membership) {
    return this.db.many(`select p.id, v.name as venue_name, p.period, p.capacity - (select count(*) from parking_spots s where s.area_id = p.id) as free, s.code
      from parking_areas p join venues v on v.id = p.venue_id left join parking_spots s on s.area_id = p.id and s.attendee_id = $2 where p.event_id = $1 order by p.period, v.name`, [m.eventId, m.attendeeId]);
  }

  @Post('parking/:id') @InModule('parking')
  async reserve(@Member() m: Membership, @Param('id', Uuid) id: string) {
    await this.db.tx(async (q) => {
      const a = found(await q.one<{ capacity: number }>('select capacity from parking_areas where id = $1 and event_id = $2 for update', [id, m.eventId]), 'Estacionamento não encontrado.');
      if (await q.one('select id from parking_spots where area_id = $1 and attendee_id = $2', [id, m.attendeeId])) return;
      const n = (await q.one<{ n: number }>('select count(*) as n from parking_spots where area_id = $1', [id]))!.n;
      if (n >= a.capacity) throw new ConflictException('Estacionamento lotado.');
      await q.many(`insert into parking_spots (event_id, area_id, attendee_id, code) values ($1,$2,$3, 'V-' || upper(substr(md5(random()::text), 1, 5)))`, [m.eventId, id, m.attendeeId]);
    });
    return { ok: true };
  }

  @Delete('parking/:id') @InModule('parking')
  async release(@Member() m: Membership, @Param('id', Uuid) id: string) {
    await this.db.many('delete from parking_spots where area_id = $1 and attendee_id = $2', [id, m.attendeeId]);
    return { ok: true };
  }

  @Get('membership') @InModule('membership')
  async membership(@Member() m: Membership) {
    const s = await this.db.one<{ id: string }>('select id, status, valid_until from memberships where attendee_id = $1', [m.attendeeId]);
    const payments = s ? await this.db.many('select id, title, amount, due_on, paid_at from membership_payments where membership_id = $1 order by due_on', [s.id]) : [];
    return { membership: s ?? null, payments };
  }

  @Get('cost-shares') @InModule('cost_shares')
  costShares(@Member() m: Membership) {
    return this.db.many('select c.id, c.title, c.total, c.parts, x.amount, x.is_paid from cost_share_members x join cost_shares c on c.id = x.cost_share_id where c.event_id = $1 and x.attendee_id = $2 order by x.is_paid, c.title', [m.eventId, m.attendeeId]);
  }

  @Get('network') @InModule('network')
  network(@Member() m: Membership, @Query('q') q = '') {
    const like = `%${String(q).slice(0, 80).replace(/[\\%_]/g, '\\$&')}%`;
    return this.db.many(`select n.id, n.name, n.industry, u.city, u.name as owner, a.id as attendee_id, a.id = $3 as mine from network_companies n
      join attendees a on a.id = n.attendee_id join users u on u.id = a.user_id where n.event_id = $1 and concat_ws(' ', n.name, n.industry, u.city) ilike $2 order by n.name limit 100`, [m.eventId, like, m.attendeeId]);
  }

  /** inscrição vale 2 pontos e check-in vale 10 (regra a confirmar) */
  @Get('ranking') @InModule('ranking')
  async ranking(@Member() m: Membership) {
    const rows = await this.db.many<{ attendeeId: string; name: string; points: number; checkins: number; position: number }>(`
      with score as (select a.id as attendee_id, u.name, (count(r.id) * 2 + count(c.id) * 10)::int as points, count(c.id)::int as checkins
        from attendees a join users u on u.id = a.user_id and u.deleted_at is null left join registrations r on r.attendee_id = a.id left join check_ins c on c.registration_id = r.id
        where a.event_id = $1 group by a.id, u.name)
      select *, (rank() over (order by points desc))::int as position from score order by points desc, name`, [m.eventId]);
    const me = rows.find((r) => r.attendeeId === m.attendeeId)!;
    const top = rows.slice(0, 10);
    return { me, rows: (top.includes(me) ? top : [...top, me]).map((r) => ({ ...r, mine: r === me })) };
  }

  @Get('support') @InModule('support')
  support(@Member() m: Membership) { return this.db.many('select id, number, subject, message, status, created_at from support_tickets where attendee_id = $1 order by number desc', [m.attendeeId]); }

  @Post('support') @InModule('support') @Throttle({ default: { limit: config.devTools ? 600 : 10, ttl: 60_000 } })
  async open(@Member() m: Membership, @Body(new Zod(ticketBody)) b: z.infer<typeof ticketBody>) {
    return this.db.one('insert into support_tickets (event_id, attendee_id, subject, message) values ($1,$2,$3,$4) returning id, number', [m.eventId, m.attendeeId, b.subject, b.message]);
  }

  @Post('join-requests') @Throttle({ default: { limit: config.devTools ? 600 : 5, ttl: 60_000 } })
  async join(@Member() m: Membership, @Body(new Zod(joinBody)) b: z.infer<typeof joinBody>) {
    await this.db.many('insert into join_requests (event_id, name, city, contact) values ($1,$2,$3,$4)', [m.eventId, b.name, b.city, b.contact]);
    return { ok: true };
  }

  @Get('news') @InModule('news')
  news(@Member() m: Membership) { return this.db.many('select id, title, body, published_at from news where event_id = $1 order by published_at desc limit 50', [m.eventId]); }

  @Get('notifications')
  notifications(@Member() m: Membership) { return this.db.many('select id, title, body, target, is_read, created_at from notifications where attendee_id = $1 order by created_at desc, id desc limit 50', [m.attendeeId]); }

  @Post('notifications/read') @HttpCode(200)
  async read(@Member() m: Membership) {
    await this.db.many('update notifications set is_read = true where attendee_id = $1 and not is_read', [m.attendeeId]);
    return { ok: true };
  }

  @Get('museum') @InModule('museum')
  museum(@Member() m: Membership) { return this.db.many('select id, category, title, year, location, temperature, humidity, conservation, security, icon from collection_items where event_id = $1 order by year', [m.eventId]); }

  @Get('museum/:id') @InModule('museum')
  async piece(@Member() m: Membership, @Param('id', Uuid) id: string) {
    return found(await this.db.one('select id, category, title, year, location, temperature, humidity, conservation, security, icon from collection_items where event_id = $1 and id = $2', [m.eventId, id]), 'Peça não encontrada.');
  }
}
