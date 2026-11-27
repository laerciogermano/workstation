import { Body, ConflictException, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AuthGuard, EventGuard, InModule, Member, Only, Uuid, Zod, found, text, type Membership } from '../common.js';
import { config } from '../config.js';
import { Db, type Queryable } from '../database.js';
import { Hub } from './realtime.js';
import { notify } from './notify.js';

const lotBody = z.object({ title: text(3, 140, 'Dê um título ao lote.'), description: text(0, 2000, 'Descrição longa demais.').default(''), startingBid: z.coerce.number().positive('Informe o lance inicial.').max(10_000_000) });
const bidBody = z.object({ amount: z.number({ error: 'Informe o valor.' }).positive().multipleOf(0.01).max(10_000_000) });
type Auction = { id: string; status: 'scheduled' | 'open' | 'closed'; bidStep: number; title: string };
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const LOT_SQL = `select l.id, l.title, l.description, l.starting_bid, l.status, t.amount as top_bid, t.attendee_id = $2 as leading, u.name as leader,
  (select count(*) from bids b where b.lot_id = l.id) as bid_count, l.winner_id = $2 as won
  from lots l join auctions au on au.id = l.auction_id
  left join lateral (select amount, attendee_id from bids b where b.lot_id = l.id order by amount desc limit 1) t on true
  left join attendees a on a.id = t.attendee_id left join users u on u.id = a.user_id where au.event_id = $1`;

/** vende o lote ao maior lance e gera o pedido do comprador */
async function sell(q: Queryable, eventId: string, lotId: string) {
  const top = await q.one<{ attendeeId: string; amount: number; title: string }>('select b.attendee_id, b.amount, l.title from bids b join lots l on l.id = b.lot_id where l.id = $1 order by b.amount desc limit 1', [lotId]);
  if (!top) return false;
  await q.many(`update lots set status = 'sold', winner_id = $2 where id = $1`, [lotId, top.attendeeId]);
  const order = await q.one<{ id: string }>(`insert into orders (event_id, attendee_id, source, total, ref_id) values ($1,$2,'auction',$3,$4) returning id`, [eventId, top.attendeeId, top.amount, lotId]);
  await q.many('insert into order_items (order_id, seq, description, quantity, unit_price, ref_id) values ($1,1,$2,1,$3,$4)', [order!.id, top.title, top.amount, lotId]);
  await notify(q, [top.attendeeId], 'Lote arrematado', `${top.title} por ${brl(top.amount)}`, '/pedidos');
  return true;
}

@Controller('events/:eventId/auction') @UseGuards(AuthGuard, EventGuard) @InModule('auction')
export class AuctionController {
  constructor(private db: Db, private hub: Hub) {}

  private auction(q: Queryable, eventId: string, lock = '') {
    return q.one<Auction>(`select id, status, bid_step, title from auctions where event_id = $1 ${lock}`, [eventId]);
  }

  @Get()
  async get(@Member() m: Membership) {
    const auction = await this.db.one('select au.id, au.title, au.status, au.bid_step, au.scheduled_at, v.name as venue_name from auctions au left join venues v on v.id = au.venue_id where au.event_id = $1', [m.eventId]);
    const lots = await this.db.many(`${LOT_SQL} order by l.status desc, l.created_at, l.id`, [m.eventId, m.attendeeId]);
    return { auction: auction ?? null, lots };
  }

  @Get('lots/:id')
  async lot(@Member() m: Membership, @Param('id', Uuid) id: string) {
    const lot = found(await this.db.one<Record<string, unknown>>(`${LOT_SQL} and l.id = $3`, [m.eventId, m.attendeeId, id]), 'Lote não encontrado.');
    const history = await this.db.many('select b.amount, b.at, u.name, b.attendee_id = $2 as mine from bids b join attendees a on a.id = b.attendee_id join users u on u.id = a.user_id where b.lot_id = $1 order by b.amount desc limit 50', [id, m.attendeeId]);
    const auction = await this.auction(this.db, m.eventId);
    return { ...lot, history, auctionStatus: auction!.status, bidStep: auction!.bidStep };
  }

  @Post('call') @HttpCode(200) @Only('auctioneer', 'organizer')
  async call(@Member() m: Membership) {
    await this.db.tx(async (q) => {
      const a = await q.one<{ title: string }>(`update auctions set status = 'open', called_at = now() where event_id = $1 and status = 'scheduled' returning title`, [m.eventId]);
      if (!a) throw new ConflictException('O leilão não está agendado.');
      const all = await q.many<{ id: string }>('select id from attendees where event_id = $1 and id <> $2', [m.eventId, m.attendeeId]);
      await notify(q, all.map((x) => x.id), 'O leilão começou', `${a.title}: os lances estão abertos.`, '/leilao');
    });
    this.hub.publish(m.eventId, 'auction');
    return { ok: true };
  }

  @Post('close') @HttpCode(200) @Only('auctioneer', 'organizer')
  async close(@Member() m: Membership) {
    await this.db.tx(async (q) => {
      const a = await this.auction(q, m.eventId, 'for update');
      if (a?.status !== 'open') throw new ConflictException('O leilão não está ao vivo.');
      const open = await q.many<{ id: string }>(`select id from lots where auction_id = $1 and status = 'open' order by id for update`, [a.id]);
      for (const l of open) await sell(q, m.eventId, l.id);
      await q.many(`update auctions set status = 'closed' where id = $1`, [a.id]);
    });
    this.hub.publish(m.eventId, 'auction');
    return { ok: true };
  }

  @Post('lots') @Only('auctioneer', 'organizer')
  async create(@Member() m: Membership, @Body(new Zod(lotBody)) b: z.infer<typeof lotBody>) {
    const a = await this.auction(this.db, m.eventId)
      ?? (await this.db.one<Auction>(`insert into auctions (event_id, title) values ($1, 'Leilão do evento') returning id, status, bid_step, title`, [m.eventId]))!;
    if (a.status === 'closed') throw new ConflictException('O leilão já foi encerrado.');
    const lot = await this.db.one('insert into lots (auction_id, title, description, starting_bid) values ($1,$2,$3,$4) returning id', [a.id, b.title, b.description, b.startingBid]);
    this.hub.publish(m.eventId, 'auction');
    return lot;
  }

  @Post('lots/:id/close') @HttpCode(200) @Only('auctioneer', 'organizer')
  async closeLot(@Member() m: Membership, @Param('id', Uuid) id: string) {
    await this.db.tx(async (q) => {
      const l = found(await q.one<{ status: string; auction: string }>('select l.status, au.status as auction from lots l join auctions au on au.id = l.auction_id where l.id = $1 and au.event_id = $2 for update of l', [id, m.eventId]), 'Lote não encontrado.');
      if (l.auction !== 'open' || l.status !== 'open') throw new ConflictException('Este lote não está em disputa.');
      if (!(await sell(q, m.eventId, id))) throw new ConflictException('Sem lances: o lote segue aberto.');
    });
    this.hub.publish(m.eventId, 'auction');
    return { ok: true };
  }

  @Post('lots/:id/bids') @Throttle({ default: { limit: config.devTools ? 600 : 30, ttl: 60_000 } })
  async bid(@Member() m: Membership, @Param('id', Uuid) id: string, @Body(new Zod(bidBody)) b: z.infer<typeof bidBody>) {
    await this.db.tx(async (q) => {
      // a trava no lote põe os lances em fila
      const l = found(await q.one<{ status: string; startingBid: number; title: string }>('select l.status, l.starting_bid, l.title from lots l join auctions au on au.id = l.auction_id where l.id = $1 and au.event_id = $2 for update of l', [id, m.eventId]), 'Lote não encontrado.');
      const a = await this.auction(q, m.eventId);
      if (a!.status !== 'open' || l.status !== 'open') throw new ConflictException('Os lances deste lote estão fechados.');
      const top = await q.one<{ amount: number; attendeeId: string }>('select amount, attendee_id from bids where lot_id = $1 order by amount desc limit 1', [id]);
      if (top?.attendeeId === m.attendeeId) throw new ConflictException('Você já lidera este lote.');
      const next = top ? top.amount + a!.bidStep : l.startingBid;
      if (b.amount < next) throw new ConflictException(`O maior lance mudou. O próximo é ${brl(next)}.`);
      if (b.amount > next + a!.bidStep * 100) throw new ConflictException('Valor muito acima do lance atual. Confira.');
      await q.many('insert into bids (lot_id, attendee_id, amount) values ($1,$2,$3)', [id, m.attendeeId, b.amount]);
      if (top) await notify(q, [top.attendeeId], 'Seu lance foi superado', `${l.title}: agora ${brl(b.amount)}`, `/leilao/${id}`);
    });
    this.hub.publish(m.eventId, 'auction');
    return { ok: true };
  }
}
