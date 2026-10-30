import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ExtractService } from './extract.service';

@Controller('extract')
export class ExtractController {
  constructor(private readonly extractService: ExtractService) {}

  /**
   * Dispara login-extract-profiles (fire-and-forget).
   * Query: `limit` / `n` / `maxProfiles` (default 5, máx. 500);
   * `q` / `query` / `search` = termo colado no Search do LinkedIn (default comprador).
   */
  @Get('start')
  @RequirePermissions('extract:write')
  start(
    @Query('limit') limit?: string,
    @Query('n') n?: string,
    @Query('maxProfiles') maxProfiles?: string,
    @Query('q') q?: string,
    @Query('query') query?: string,
    @Query('search') search?: string,
  ) {
    return this.extractService.start({
      limit: limit ?? n ?? maxProfiles,
      query: q ?? query ?? search,
    });
  }

  /**
   * Reporta skips por perfil já existente (corrobora se a busca está saturada).
   * Body/query: `viewportFails` (tela atual) e/ou `fails` (total absoluto).
   * Ex.: POST /extract/fails { "viewportFails": 3 }
   */
  @Post('fails')
  @RequirePermissions('extract:write')
  reportFails(
    @Body() body?: { viewportFails?: number; fails?: number },
    @Query('viewportFails') viewportFailsQ?: string,
    @Query('fails') failsQ?: string,
  ) {
    return this.extractService.reportFails({
      viewportFails:
        body?.viewportFails ??
        (viewportFailsQ !== undefined && viewportFailsQ !== ''
          ? Number(viewportFailsQ)
          : undefined),
      fails:
        body?.fails ??
        (failsQ !== undefined && failsQ !== '' ? Number(failsQ) : undefined),
    });
  }

  /**
   * Dispara login-extract-profile-detail --id <uuid>.
   * Ex.: GET /extract/detail/start?id=<uuid>
   */
  @Get('detail/start')
  @RequirePermissions('extract:write')
  startDetail(@Query('id') id: string) {
    return this.extractService.startDetail(id);
  }

  /**
   * Abre perfil por URL (deep link) → OCR cartão (avatar, nome, infos) → upsert na base.
   * Ex.: GET /extract/by-url/start?url=https://www.linkedin.com/in/…
   */
  @Get('by-url/start')
  @RequirePermissions('extract:write')
  startByUrl(
    @Query('url') url?: string,
    @Query('profileUrl') profileUrl?: string,
  ) {
    return this.extractService.startByUrl(url || profileUrl || '');
  }

  @Get('status')
  @RequirePermissions('extract:read')
  status() {
    return this.extractService.status();
  }
}
