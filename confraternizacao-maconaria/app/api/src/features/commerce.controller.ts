import { Body, ConflictException, Controller, ForbiddenException, Get, HttpCode, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard, EventGuard, InModule, Member, Uuid, Zod, found, type Membership } from '../common.js';
import { config } from '../config.js';
import { Db, type Queryable } from '../database.js';
import { canSee, type ModuleKey } from '../modules.js';
import { token } from '../auth/crypto.js';
import { register } from './program.controller.js';
import { Hub } from './realtime.js';

const quantity = z.coerce.number().int().min(1).max(10);
const orderBody = z.discriminatedUnion('source', [
  z.object({ source: z.literal('ticket'), ticketTypeId: z.uuid(), quantity: quantity.max(4, 'Até 4 ingressos por compra.'), holder: z.enum(['brother', 'guest']).default('brother') }),
  z.object({ source: z.literal('shop'), productId: z.uuid(), quantity: quantity.default(1) }),
  z.object({ source: z.literal('membership'), paymentId: z.uuid() }),
  z.object({ source: z.literal('cost_share'), costShareId: z.uuid() }),
], { error: 'Pedido inválido.' });
const MODULE_OF: Record<string, ModuleKey> = { ticket: 'tickets', shop: 'products', membership: 'membership', cost_share: 'cost_shares', auction: 'auction' };

const ORDER_SQL = `select o.id, o.source, o.status, o.total, o.created_at,
  (select json_agg(json_build_object('description', i.description, 'quantity', i.quantity, 'unitPrice', i.unit_price) order by i.seq) from order_items i where i.order_id = o.id) as items
  from orders o where o.attendee_id = $1`;

@Controller('events/:eventId') @UseGuards(AuthGuard, EventGuard)
export class CommerceController {
  constructor(private db: Db, private hub: Hub) {}

  @Get('ticket-types') @InModule('tickets')
  ticketTypes(@Member() m: Membership) {
    return this.db.many('select t.id, t.name, t.price, s.id as session_id, s.title, s.starts_at from ticket_types t join sessions s on s.id = t.session_id where t.event_id = $1 order by s.starts_at, t.name', [m.eventId]);
  }

  @Get('products') @InModule('products')
  products(@Member() m: Membership) { return this.db.many('select id, name, description, icon, price, stock from products where event_id = $1 order by price desc', [m.eventId]); }

  @Get('orders')
  orders(@Member() m: Membership) { return this.db.many(`${ORDER_SQL} and o.status <> 'cancelled' order by o.created_at desc`, [m.attendeeId]); }

  @Get('orders/:id')
  async order(@Member() m: Membership, @Param('id', Uuid) id: string) { return found(await this.db.one(`${ORDER_SQL} and o.id = $2`, [m.attendeeId, id]), 'Pedido não encontrado.'); }

  private async insert(q: Queryable, m: Membership, source: string, ref: string, description: string, qty: number, unit: number) {
    // um pedido em aberto por item: tocar duas vezes não duplica a cobrança
    await q.many(`update orders set status = 'cancelled' where attendee_id = $1 and source = $2 and ref_id = $3 and status = 'pending'`, [m.attendeeId, source, ref]);
    const o = await q.one<{ id: string }>('insert into orders (event_id, attendee_id, source, total, ref_id) values ($1,$2,$3,$4,$5) returning id', [m.eventId, m.attendeeId, source, Math.round(qty * unit * 100) / 100, ref]);
    await q.many('insert into order_items (order_id, seq, description, quantity, unit_price, ref_id) values ($1,1,$2,$3,$4,$5)', [o!.id, description, qty, unit, ref]);
    return o!;
  }

  /** o preço sempre vem do banco */
  @Post('orders')
  create(@Member() m: Membership, @Body(new Zod(orderBody)) b: z.infer<typeof orderBody>) {
    if (!canSee(m.modules, MODULE_OF[b.source], m.roles)) throw new ForbiddenException('Este recurso não está disponível neste evento.');
    return this.db.tx(async (q) => {
      if (b.source === 'ticket') {
        const t = found(await q.one<{ name: string; price: number; title: string; full: boolean }>(`select t.name, t.price, s.title,
          (select count(*) from registrations r where r.session_id = s.id) >= s.capacity and not exists (select 1 from registrations r where r.session_id = s.id and r.attendee_id = $3) as full
          from ticket_types t join sessions s on s.id = t.session_id where t.id = $1 and t.event_id = $2`, [b.ticketTypeId, m.eventId, m.attendeeId]), 'Ingresso não encontrado.');
        if (t.full) throw new ConflictException('Vagas esgotadas.');
        return this.insert(q, m, 'ticket', b.ticketTypeId, `${t.title} · ${b.holder === 'guest' ? 'Acompanhante' : 'Irmão'}`, b.quantity, t.price);
      }
      if (b.source === 'shop') {
        const p = found(await q.one<{ name: string; price: number; stock: number }>('select name, price, stock from products where id = $1 and event_id = $2', [b.productId, m.eventId]), 'Produto não encontrado.');
        if (p.stock < b.quantity) throw new ConflictException('Produto sem estoque.');
        return this.insert(q, m, 'shop', b.productId, p.name, b.quantity, p.price);
      }
      if (b.source === 'membership') {
        const x = found(await q.one<{ title: string; amount: number; paidAt: string | null }>('select p.title, p.amount, p.paid_at from membership_payments p join memberships s on s.id = p.membership_id where p.id = $1 and s.attendee_id = $2', [b.paymentId, m.attendeeId]), 'Parcela não encontrada.');
        if (x.paidAt) throw new ConflictException('Esta parcela já foi paga.');
        return this.insert(q, m, 'membership', b.paymentId, x.title, 1, x.amount);
      }
      const c = found(await q.one<{ title: string; amount: number; isPaid: boolean }>('select c.title, x.amount, x.is_paid from cost_share_members x join cost_shares c on c.id = x.cost_share_id where c.id = $1 and x.attendee_id = $2 and c.event_id = $3', [b.costShareId, m.attendeeId, m.eventId]), 'Rateio não encontrado.');
      if (c.isPaid) throw new ConflictException('Sua parte já foi paga.');
      return this.insert(q, m, 'cost_share', b.costShareId, c.title, 1, c.amount);
    });
  }

  /** Não há meio de pagamento contratado. Esta rota só existe em desenvolvimento. */
  @Post('orders/:id/simulate-payment') @HttpCode(200)
  async pay(@Member() m: Membership, @Param('id', Uuid) id: string) {
    if (!config.devTools) throw new NotFoundException();
    await this.db.tx(async (q) => {
      const o = found(await q.one<{ source: string; status: string; refId: string }>('select source, status, ref_id from orders where id = $1 and attendee_id = $2 for update', [id, m.attendeeId]), 'Pedido não encontrado.');
      if (o.status !== 'pending') throw new ConflictException('Este pedido não está em aberto.');
      const item = (await q.one<{ quantity: number }>('select quantity from order_items where order_id = $1 and seq = 1', [id]))!;
      if (o.source === 'ticket') {
        const t = (await q.one<{ sessionId: string }>('select session_id from ticket_types where id = $1', [o.refId]))!;
        await register(q, m.eventId, t.sessionId, m.attendeeId);
        for (let i = 0; i < Number(item.quantity); i++) await q.many('insert into tickets (ticket_type_id, attendee_id, order_id, code) values ($1,$2,$3,$4)', [o.refId, m.attendeeId, id, token().slice(0, 16)]);
      } else if (o.source === 'shop') {
        if (!(await q.one('update products set stock = stock - $2 where id = $1 and stock >= $2 returning id', [o.refId, Number(item.quantity)]))) throw new ConflictException('Produto sem estoque.');
      } else if (o.source === 'membership') {
        const p = (await q.one<{ membershipId: string }>('update membership_payments set paid_at = now() where id = $1 returning membership_id', [o.refId]))!;
        await q.many(`update memberships set status = case when exists (select 1 from membership_payments where membership_id = $1 and paid_at is null and due_on < current_date) then 'overdue' else 'good_standing' end where id = $1`, [p.membershipId]);
      } else if (o.source === 'cost_share') {
        await q.many('update cost_share_members set is_paid = true where cost_share_id = $1 and attendee_id = $2', [o.refId, m.attendeeId]);
      }
      await q.many(`update orders set status = 'paid', paid_at = now() where id = $1`, [id]);
    });
    this.hub.publish(m.eventId, 'program');
    return { ok: true };
  }
}
