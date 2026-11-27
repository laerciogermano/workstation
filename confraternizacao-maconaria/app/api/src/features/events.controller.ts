import { Body, ConflictException, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import QRCode from 'qrcode';
import { z } from 'zod';
import { AuthGuard, EventGuard, InModule, Member, Only, User, Uuid, Zod, found, sign, text, type Me, type Membership } from '../common.js';
import { Db } from '../database.js';
import { MODULES, canSee, defaultModules, type ModuleKey } from '../modules.js';

const createBody = z.object({ name: text(3, 120, 'Dê um nome ao evento.'), city: text(0, 80, 'Cidade inválida.').default('') });
const profileBody = z.object({ lodge: text(0, 120, 'Loja inválida.'), obedience: text(0, 80, 'Potência inválida.'), cim: text(0, 30, 'CIM inválido.') });
const facialBody = z.object({ accept: z.literal(true, { error: 'Marque a autorização para continuar.' }) });

@Controller('events') @UseGuards(AuthGuard)
export class EventListController {
  constructor(private db: Db) {}

  /** CU-70: rascunhos só aparecem para quem participa */
  @Get()
  list(@User() me: Me) {
    return this.db.many(`select e.id, e.name, e.slug, e.city, e.starts_on, e.ends_on, e.status, a.id is not null as joined, coalesce('organizer' = any(a.roles), false) as organizer
      from events e left join attendees a on a.event_id = e.id and a.user_id = $1 where e.status = 'published' or a.id is not null order by e.starts_on nulls last, e.created_at`, [me.id]);
  }

  @Post()
  async create(@User() me: Me, @Body(new Zod(createBody)) b: z.infer<typeof createBody>) {
    const source = await this.db.one<{ organizationId: string; lodge: string; obedience: string; cim: string }>(
      `select e.organization_id, a.lodge, a.obedience, a.cim from attendees a join events e on e.id = a.event_id where a.user_id = $1 and 'organizer' = any(a.roles) limit 1`, [me.id]);
    if (!source) throw new ForbiddenException('Só a organização cria eventos.');
    const slug = `${b.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'evento'}-${Date.now().toString(36)}`;
    return this.db.tx(async (q) => {
      const e = await q.one<{ id: string }>('insert into events (organization_id, name, slug, city, modules) values ($1,$2,$3,$4,$5) returning id', [source.organizationId, b.name, slug, b.city, defaultModules()]);
      await q.many(`insert into attendees (event_id, user_id, lodge, obedience, cim, roles) values ($1,$2,$3,$4,$5,'{organizer}')`, [e!.id, me.id, source.lodge, source.obedience, source.cim]);
      return e;
    });
  }

  @Post(':eventId/join')
  async join(@User() me: Me, @Param('eventId', Uuid) id: string) {
    if (await this.db.one('select id from attendees where event_id = $1 and user_id = $2', [id, me.id])) return { ok: true };
    found(await this.db.one(`select id from events where id = $1 and status = 'published'`, [id]), 'A programação deste evento ainda não foi publicada.');
    await this.db.many(`insert into attendees (event_id, user_id, lodge, obedience, cim)
      select $1, $2, coalesce(max(lodge), ''), coalesce(max(obedience), ''), coalesce(max(cim), '') from attendees where user_id = $2 on conflict do nothing`, [id, me.id]);
    return { ok: true };
  }
}

@Controller('events/:eventId') @UseGuards(AuthGuard, EventGuard)
export class EventController {
  constructor(private db: Db) {}

  @Get('context')
  async context(@Member() m: Membership) {
    const event = await this.db.one('select id, name, slug, city, starts_on, ends_on, status from events where id = $1', [m.eventId]);
    const me = await this.db.one('select a.id as attendee_id, a.lodge, a.obedience, a.cim, a.office, a.roles, coalesce(f.is_active, false) as facial from attendees a left join facial_opt_ins f on f.attendee_id = a.id where a.id = $1', [m.attendeeId]);
    const counts = await this.db.one(`select
      (select count(*) from notifications where attendee_id = $1 and not is_read) as notifications,
      (select count(*) from registrations where attendee_id = $1) as registrations,
      (select count(*) from check_ins c join registrations r on r.id = c.registration_id where r.attendee_id = $1) as checkins,
      (select count(*) from messages msg join chats ch on ch.id = msg.chat_id
         left join chat_members cm on cm.chat_id = ch.id and cm.attendee_id = $1
        where msg.author_id <> $1 and msg.sent_at > coalesce(cm.last_read_at, 'epoch')
          and (exists (select 1 from registrations r where r.session_id = ch.session_id and r.attendee_id = $1) or (ch.type = 'direct' and cm.attendee_id is not null))) as messages`, [m.attendeeId]);
    const membership = await this.db.one<{ status: string }>('select status from memberships where attendee_id = $1', [m.attendeeId]);
    const modules = Object.fromEntries((Object.keys(MODULES) as ModuleKey[]).map((k) => [k, canSee(m.modules, k, m.roles)]));
    return { event, me, counts, modules, membership: membership?.status ?? null };
  }

  @Patch('publish') @Only('organizer')
  async publish(@Member() m: Membership) {
    const ok = await this.db.one(`update events set status = 'published' where id = $1 and exists (select 1 from sessions where event_id = $1) returning id`, [m.eventId]);
    if (!ok) throw new ConflictException('Cadastre ao menos um item na programação antes de publicar.');
    return { ok: true };
  }

  @Put('profile')
  async profile(@Member() m: Membership, @Body(new Zod(profileBody)) b: z.infer<typeof profileBody>) {
    await this.db.many('update attendees set lodge=$2, obedience=$3, cim=$4 where id=$1', [m.attendeeId, b.lodge, b.obedience, b.obedience.startsWith('GOB') ? b.cim : '']);
    return { ok: true };
  }

  /** CU-26: o código assinado vale por um dia e permite conferir a carteirinha na entrada */
  @Get('card') @InModule('membership_card')
  async card(@Member() m: Membership) {
    return { qr: await QRCode.toDataURL(sign({ kind: 'card', attendee: m.attendeeId, event: m.eventId }, 86_400), { margin: 1, width: 336 }) };
  }

  /** CU-67: guarda só o consentimento; nenhuma imagem do rosto é coletada */
  @Post('facial')
  async facial(@User() me: Me, @Member() m: Membership, @Body(new Zod(facialBody)) _b: unknown) {
    await this.db.tx(async (q) => {
      await q.many(`insert into consents (user_id, type, accepted) values ($1, 'facial', true)`, [me.id]);
      await q.many('insert into facial_opt_ins (attendee_id) values ($1) on conflict (attendee_id) do update set is_active = true', [m.attendeeId]);
    });
    return { ok: true };
  }
  @Delete('facial')
  async facialRemove(@User() me: Me, @Member() m: Membership) {
    await this.db.tx(async (q) => {
      await q.many(`insert into consents (user_id, type, accepted) values ($1, 'facial', false)`, [me.id]);
      await q.many('delete from facial_opt_ins where attendee_id = $1', [m.attendeeId]);
    });
    return { ok: true };
  }
}
