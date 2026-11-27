import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AuthGuard, EventGuard, Member, Uuid, Zod, found, text, type Membership } from '../common.js';
import { config } from '../config.js';
import { Db } from '../database.js';
import { Hub } from './realtime.js';
import { notify } from './notify.js';

const messageBody = z.object({ body: text(1, 2000, 'Escreva uma mensagem de até 2000 caracteres.') });
const directBody = z.object({ attendeeId: z.uuid() });
type Chat = { id: string; type: 'group' | 'direct'; sessionId: string | null };

const LAST = `left join lateral (select msg.body, msg.sent_at, msg.author_id, u.name as author from messages msg join attendees a on a.id = msg.author_id join users u on u.id = a.user_id
  where msg.chat_id = c.id order by msg.sent_at desc limit 1) l on true`;
const UNREAD = `(select count(*) from messages x where x.chat_id = c.id and x.author_id <> $2 and x.sent_at > coalesce(me.last_read_at, 'epoch')) as unread`;

@Controller('events/:eventId/chats') @UseGuards(AuthGuard, EventGuard)
export class ChatController {
  constructor(private db: Db, private hub: Hub) {}

  /** grupo exige inscrição; privada exige ser um dos dois */
  private async access(m: Membership, chatId: string) {
    return found(await this.db.one<Chat>(`select c.id, c.type, c.session_id from chats c where c.id = $1 and c.event_id = $2 and (
      (c.type = 'group' and exists (select 1 from registrations r where r.session_id = c.session_id and r.attendee_id = $3)) or
      (c.type = 'direct' and exists (select 1 from chat_members x where x.chat_id = c.id and x.attendee_id = $3)))`, [chatId, m.eventId, m.attendeeId]), 'Conversa não encontrada.');
  }
  private async audience(chat: Chat) {
    const rows = await this.db.many<{ attendeeId: string }>(chat.type === 'group' ? 'select attendee_id from registrations where session_id = $1' : 'select attendee_id from chat_members where chat_id = $1', [chat.type === 'group' ? chat.sessionId : chat.id]);
    return rows.map((r) => r.attendeeId);
  }
  private read(chatId: string, attendeeId: string) {
    return this.db.many('insert into chat_members (chat_id, attendee_id, last_read_at) values ($1,$2,now()) on conflict (chat_id, attendee_id) do update set last_read_at = now()', [chatId, attendeeId]);
  }

  @Get()
  async list(@Member() m: Membership) {
    const groups = await this.db.many(`select c.id, s.title, s.starts_at, l.body as last_body, l.sent_at as last_at, l.author as last_author, l.author_id = $2 as last_mine, ${UNREAD}
      from chats c join sessions s on s.id = c.session_id join registrations r on r.session_id = s.id and r.attendee_id = $2
      left join chat_members me on me.chat_id = c.id and me.attendee_id = $2 ${LAST} where c.event_id = $1 order by s.starts_at`, [m.eventId, m.attendeeId]);
    const direct = await this.db.many(`select c.id, u.name as title, u.photo, o.id as attendee_id, l.body as last_body, l.sent_at as last_at, l.author_id = $2 as last_mine, ${UNREAD}
      from chats c join chat_members me on me.chat_id = c.id and me.attendee_id = $2
      join chat_members om on om.chat_id = c.id and om.attendee_id <> $2 join attendees o on o.id = om.attendee_id join users u on u.id = o.user_id
      ${LAST} where c.event_id = $1 and c.type = 'direct' and l.sent_at is not null order by l.sent_at desc`, [m.eventId, m.attendeeId]);
    const total = await this.db.one<{ n: number }>('select count(*) as n from sessions where event_id = $1', [m.eventId]);
    return { groups, direct, locked: total!.n - groups.length };
  }

  @Get(':id/messages')
  async messages(@Member() m: Membership, @Param('id', Uuid) id: string) {
    const chat = await this.access(m, id);
    const head = chat.type === 'group'
      ? await this.db.one(`select s.title, v.name as subtitle, s.starts_at, (select count(*) from registrations r where r.session_id = s.id) as members from sessions s join venues v on v.id = s.venue_id where s.id = $1`, [chat.sessionId])
      : await this.db.one('select u.name as title, u.city as subtitle, u.photo from chat_members x join attendees a on a.id = x.attendee_id join users u on u.id = a.user_id where x.chat_id = $1 and x.attendee_id <> $2', [id, m.attendeeId]);
    const messages = await this.db.many(`select * from (select msg.id, msg.body, msg.sent_at, u.name as author, msg.author_id = $2 as mine from messages msg
      join attendees a on a.id = msg.author_id join users u on u.id = a.user_id where msg.chat_id = $1 order by msg.sent_at desc limit 200) t order by sent_at`, [id, m.attendeeId]);
    await this.read(id, m.attendeeId);
    return { chat: { id, type: chat.type, ...(head ?? { title: 'Conta excluída', subtitle: '' }) }, messages };
  }

  @Post(':id/messages') @Throttle({ default: { limit: config.devTools ? 600 : 40, ttl: 60_000 } })
  async send(@Member() m: Membership, @Param('id', Uuid) id: string, @Body(new Zod(messageBody)) b: z.infer<typeof messageBody>) {
    const chat = await this.access(m, id);
    await this.db.many('insert into messages (chat_id, author_id, body) values ($1,$2,$3)', [id, m.attendeeId, b.body]);
    await this.read(id, m.attendeeId);
    const audience = await this.audience(chat);
    if (chat.type === 'direct') {
      const other = audience.filter((a) => a !== m.attendeeId);
      const me = await this.db.one<{ name: string }>('select u.name from attendees a join users u on u.id = a.user_id where a.id = $1', [m.attendeeId]);
      await this.db.many('delete from notifications where attendee_id = any($1) and target = $2 and not is_read', [other, `/chat/${id}`]);
      await notify(this.db, other, `${me!.name} mandou uma mensagem`, b.body.slice(0, 120), `/chat/${id}`);
    }
    this.hub.publish(m.eventId, 'chat', audience);
    return { ok: true };
  }

  @Post('direct')
  async direct(@Member() m: Membership, @Body(new Zod(directBody)) b: z.infer<typeof directBody>) {
    if (b.attendeeId === m.attendeeId) throw new BadRequestException('Escolha outro participante.');
    found(await this.db.one('select a.id from attendees a join users u on u.id = a.user_id where a.id = $1 and a.event_id = $2 and u.deleted_at is null', [b.attendeeId, m.eventId]), 'Participante não encontrado.');
    const key = [m.attendeeId, b.attendeeId].sort().join(':');
    return this.db.tx(async (q) => {
      await q.many(`insert into chats (event_id, type, direct_key) values ($1,'direct',$2) on conflict (direct_key) do nothing`, [m.eventId, key]);
      const c = await q.one<{ id: string }>('select id from chats where direct_key = $1', [key]);
      await q.many('insert into chat_members (chat_id, attendee_id) values ($1,$2), ($1,$3) on conflict do nothing', [c!.id, m.attendeeId, b.attendeeId]);
      return c;
    });
  }
}
