import { Controller, Get, Header, Inject, Param } from '@nestjs/common';
import { CitiesQuery, type CepDto, type CityDto, type EventTypeDto } from '@rolego/contracts';
import { asc, sql } from 'drizzle-orm';
import { Public } from '../../shared/auth/viewer';
import { DB, rows, type Db } from '../../shared/db/db';
import { eventTypes } from '../../shared/db/schema';
import { AppError } from '../../shared/errors/app-error';
import { GeocodingPort } from '../../shared/geo/geocoding';
import { ZQuery } from '../../shared/http/zod';

@Controller('catalog')
export class CatalogController {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly geo: GeocodingPort,
  ) {}

  @Public()
  @Get('event-types')
  @Header('Cache-Control', 'public, max-age=3600')
  async types(): Promise<EventTypeDto[]> {
    return this.db.select({ slug: eventTypes.slug, label: eventTypes.label, accent: eventTypes.accent }).from(eventTypes).orderBy(asc(eventTypes.sort));
  }

  /** Busca sem acento (T-06). Cidades live primeiro. */
  @Public()
  @Get('cities')
  @Header('Cache-Control', 'public, max-age=3600')
  async cities(@ZQuery(CitiesQuery) q: { q?: string }): Promise<CityDto[]> {
    const term = q.q?.trim() ? `%${q.q.trim()}%` : null;
    return rows<CityDto>(
      this.db,
      sql`SELECT id, name, uf, launch_status AS "launchStatus" FROM cities
          WHERE ${term}::text IS NULL OR immutable_unaccent(lower(name)) LIKE immutable_unaccent(lower(${term}::text))
          ORDER BY (launch_status = 'live') DESC, name LIMIT 30`,
    );
  }

  @Get('cep/:cep')
  async cep(@Param('cep') cep: string): Promise<CepDto> {
    if (!/^\d{5}-?\d{3}$/.test(cep)) throw new AppError('VALIDATION_FAILED', 'CEP inválido');
    const r = await this.geo.cep(cep);
    if (!r) throw new AppError('GEOCODE_FAILED');
    return r;
  }
}
