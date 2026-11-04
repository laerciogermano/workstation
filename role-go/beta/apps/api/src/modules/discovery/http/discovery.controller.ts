import { Controller, Get } from '@nestjs/common';
import { DiscoveryQuery, type EventCard, type Origin, type Page, SearchQuery } from '@rolego/contracts';
import { CurrentViewer, type Viewer } from '../../../shared/auth/viewer';
import { ZQuery } from '../../../shared/http/zod';
import { DiscoveryService } from '../application/discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('feed')
  feed(@CurrentViewer() v: Viewer, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<Page<EventCard> & { origin: Origin }> {
    return this.discovery.feed(v, q);
  }

  @Get('swipe')
  swipe(@CurrentViewer() v: Viewer, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<EventCard[]> {
    return this.discovery.swipe(v, q);
  }

  @Get('list')
  list(@CurrentViewer() v: Viewer, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<Page<EventCard> & { origin: Origin }> {
    return this.discovery.list(v, q);
  }

  @Get('count')
  count(@CurrentViewer() v: Viewer, @ZQuery(DiscoveryQuery) q: DiscoveryQuery): Promise<{ total: number }> {
    return this.discovery.count(v, q);
  }

  @Get('search')
  search(@CurrentViewer() v: Viewer, @ZQuery(SearchQuery) q: { q: string; scope: 'radius' | 'city'; cursor?: string }): Promise<Page<EventCard>> {
    return this.discovery.search(v, q);
  }
}
