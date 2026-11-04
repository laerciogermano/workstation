import { Controller, Get } from '@nestjs/common';
import { DiscoveryQuery, type EventCard, type Origin, type Page, SearchQuery } from '@rolego/contracts';
import { OptionalViewer, Public, type Viewer } from '../../../shared/auth/viewer';
import { ZQuery } from '../../../shared/http/zod';
import { DiscoveryService } from '../application/discovery.service';

/** Descoberta é pública (visitante vê o feed); viewer opcional enriquece cards / exclusões. */
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Public()
  @Get('feed')
  feed(@OptionalViewer() v: Viewer | null, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<Page<EventCard> & { origin: Origin }> {
    return this.discovery.feed(v, q);
  }

  @Public()
  @Get('swipe')
  swipe(@OptionalViewer() v: Viewer | null, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<EventCard[]> {
    return this.discovery.swipe(v, q);
  }

  @Public()
  @Get('list')
  list(@OptionalViewer() v: Viewer | null, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<Page<EventCard> & { origin: Origin }> {
    return this.discovery.list(v, q);
  }

  @Public()
  @Get('count')
  count(@OptionalViewer() v: Viewer | null, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<{ total: number }> {
    return this.discovery.count(v, q);
  }

  @Public()
  @Get('search')
  search(@OptionalViewer() v: Viewer | null, @ZQuery(SearchQuery) q: { q: string; scope: 'radius' | 'city'; cursor?: string }): Promise<Page<EventCard>> {
    return this.discovery.search(v, q);
  }
}
