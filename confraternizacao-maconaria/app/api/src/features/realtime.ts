import { Controller, Get, Global, Injectable, Module, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, EventGuard, Member, type Membership } from '../common.js';

/** Avisos em tempo real (SSE). Vai só o assunto: o cliente busca os dados pelas rotas, que conferem permissão. */
@Injectable()
export class Hub {
  private clients = new Map<string, Set<{ res: Response; attendeeId: string }>>();
  add(eventId: string, attendeeId: string, res: Response) {
    const client = { res, attendeeId };
    const set = this.clients.get(eventId) ?? new Set();
    this.clients.set(eventId, set.add(client));
    return () => set.delete(client);
  }
  publish(eventId: string, topic: string, only?: string[]) {
    for (const c of this.clients.get(eventId) ?? []) if (!only || only.includes(c.attendeeId)) c.res.write(`data: ${JSON.stringify({ topic })}\n\n`);
  }
}

@Controller('events/:eventId/stream') @UseGuards(AuthGuard, EventGuard)
export class StreamController {
  constructor(private hub: Hub) {}
  @Get()
  open(@Member() m: Membership, @Res() res: Response) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n');
    const remove = this.hub.add(m.eventId, m.attendeeId, res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
    const expire = setTimeout(() => res.end(), 15 * 60_000); // reconecta e revalida a sessão
    res.on('close', () => { clearInterval(ping); clearTimeout(expire); remove(); });
  }
}

@Global()
@Module({ providers: [Hub], exports: [Hub] })
export class RealtimeModule {}
