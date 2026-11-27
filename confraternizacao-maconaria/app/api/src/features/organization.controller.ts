import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard, EventGuard, InModule, Member, Only, Uuid, Zod, found, text, type Membership } from '../common.js';
import { Db } from '../database.js';
import { MODULES, ROLES, type ModuleKey } from '../modules.js';
import { Hub } from './realtime.js';

const moduleBody = z.object({ enabled: z.boolean().optional(), roles: z.array(z.enum(ROLES)).optional() });
const roomBody = z.object({ reserved: z.boolean() });
const riskBody = z.object({ title: text(3, 200, 'Descreva o risco.'), level: z.enum(['low', 'medium', 'high']), ownerId: z.uuid('Escolha o responsável.'), plan: text(0, 2000, 'Plano longo demais.').default('') });

@Controller('events/:eventId') @UseGuards(AuthGuard, EventGuard)
export class OrganizationController {
  constructor(private db: Db, private hub: Hub) {}

  @Get('summary') @Only('organizer')
  summary(@Member() m: Membership) {
    return this.db.one(`select (select count(*) from sessions where event_id = $1) as sessions, (select count(*) from venues where event_id = $1) as venues,
      (select count(*) from registrations r join sessions s on s.id = r.session_id where s.event_id = $1) as registrations, (select status from events where id = $1) as status`, [m.eventId]);
  }

  @Get('modules') @Only('organizer')
  modules(@Member() m: Membership) {
    return Object.entries(MODULES).map(([key, def]) => ({ key, name: def.name, description: def.description, ...m.modules[key as ModuleKey] }));
  }

  @Put('modules/:key') @Only('organizer')
  async setModule(@Member() m: Membership, @Param('key') key: string, @Body(new Zod(moduleBody)) b: z.infer<typeof moduleBody>) {
    if (!Object.hasOwn(MODULES, key)) throw new NotFoundException('Módulo desconhecido.');
    // altera só este módulo, sem sobrescrever o que outra pessoa mudou
    await this.db.many('update events set modules = jsonb_set(modules, array[$2::text], (modules -> $2::text) || $3::jsonb) where id = $1',
      [m.eventId, key, JSON.stringify({ ...(b.enabled === undefined ? {} : { enabled: b.enabled }), ...(b.roles ? { roles: [...new Set(b.roles)] } : {}) })]);
    this.hub.publish(m.eventId, 'modules');
    return { ok: true };
  }

  @Get('attendees') @Only('organizer')
  attendees(@Member() m: Membership) {
    return this.db.many('select a.id, u.name from attendees a join users u on u.id = a.user_id where a.event_id = $1 and u.deleted_at is null order by u.name limit 500', [m.eventId]);
  }

  @Get('rooms') @InModule('rooms')
  rooms(@Member() m: Membership) {
    return this.db.many(`select r.id, r.name, r.capacity, v.name as venue_name, r.reserved_note,
      (select s.title from sessions s where s.room_id = r.id order by s.starts_at limit 1) as session_title
      from rooms r join venues v on v.id = r.venue_id where v.event_id = $1 order by v.name, r.name`, [m.eventId]);
  }

  @Put('rooms/:id') @InModule('rooms') @Only('organizer')
  async room(@Member() m: Membership, @Param('id', Uuid) id: string, @Body(new Zod(roomBody)) b: z.infer<typeof roomBody>) {
    found(await this.db.one('update rooms r set reserved_note = $3 from venues v where v.id = r.venue_id and r.id = $1 and v.event_id = $2 returning r.id',
      [id, m.eventId, b.reserved ? 'Reservada pela organização' : null]), 'Sala não encontrada.');
    return { ok: true };
  }

  @Get('risks') @InModule('risks')
  risks(@Member() m: Membership) {
    return this.db.many(`select k.id, k.title, k.level, k.plan, k.status, u.name as owner from risks k left join attendees a on a.id = k.owner_id left join users u on u.id = a.user_id
      where k.event_id = $1 order by k.status, array_position(array['high','medium','low'], k.level), k.created_at desc`, [m.eventId]);
  }

  @Post('risks') @InModule('risks') @Only('organizer')
  async risk(@Member() m: Membership, @Body(new Zod(riskBody)) b: z.infer<typeof riskBody>) {
    found(await this.db.one('select id from attendees where id = $1 and event_id = $2', [b.ownerId, m.eventId]), 'Responsável não encontrado.');
    return this.db.one('insert into risks (event_id, title, level, owner_id, plan) values ($1,$2,$3,$4,$5) returning id', [m.eventId, b.title, b.level, b.ownerId, b.plan]);
  }

  @Post('risks/:id/resolve') @HttpCode(200) @InModule('risks') @Only('organizer')
  async resolve(@Member() m: Membership, @Param('id', Uuid) id: string) {
    found(await this.db.one(`update risks set status = 'resolved' where id = $1 and event_id = $2 returning id`, [id, m.eventId]), 'Risco não encontrado.');
    return { ok: true };
  }
}
