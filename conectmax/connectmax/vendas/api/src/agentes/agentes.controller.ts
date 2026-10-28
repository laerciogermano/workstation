import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthPrincipal } from '../auth/auth-user';
import { Resource } from '../auth/resource.decorator';
import { CreateAgenteDto, UpdateAgenteDto } from './create-agente.dto';
import { AgentesService } from './agentes.service';

@Controller('agentes')
@Resource('agentes')
export class AgentesController {
  constructor(private readonly agentesService: AgentesService) {}

  /**
   * Lista. Query: `status` (ativo|dormindo), `hostKey`, `q`,
   * `sync=true` (docker ps → DB), `grouped=true` (ativos/dormindo).
   */
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('hostKey') hostKey?: string,
    @Query('q') q?: string,
    @Query('sync') sync?: string,
    @Query('grouped') grouped?: string,
  ) {
    return this.agentesService.findAll({
      status,
      hostKey,
      q,
      sync: sync === '1' || sync === 'true',
      grouped: grouped === '1' || grouped === 'true',
    });
  }

  /** Descobre containers docker-avd-* nos hosts e upsert. */
  @Post('sync')
  sync(@Query('hostKey') hostKey?: string) {
    return this.agentesService.syncFromHosts(hostKey);
  }

  @Post()
  create(
    @Body() dto: CreateAgenteDto,
    @Req() req: { user: AuthPrincipal },
  ) {
    return this.agentesService.create(dto, { creator: req.user });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('sync') sync?: string) {
    return this.agentesService.findOne(id, {
      sync: sync === '1' || sync === 'true',
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgenteDto) {
    return this.agentesService.update(id, dto);
  }

  /**
   * Gera API key do worker (`X-Api-Key`). Plain só nesta resposta.
   * Worker: claim/complete/heartbeat com essa chave (escopo do agentId).
   */
  @Post(':id/api-key')
  rotateApiKey(@Param('id') id: string) {
    return this.agentesService.rotateApiKey(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentesService.remove(id);
  }

  /** Para o container (dormindo). */
  @Post(':id/sleep')
  sleep(@Param('id') id: string) {
    return this.agentesService.sleep(id);
  }

  /** Sobe o container (ativo). */
  @Post(':id/wake')
  wake(@Param('id') id: string) {
    return this.agentesService.wake(id);
  }

  /**
   * Ping ADB no host do agente (SSH/local → `adb connect 127.0.0.1:adbPort`).
   * Não sobe/para o container.
   */
  @Post(':id/ping')
  ping(@Param('id') id: string) {
    return this.agentesService.pingAdb(id);
  }

  /** Exporta `/android-home` → tar.gz no servidor. */
  @Post(':id/backup')
  backup(@Param('id') id: string) {
    return this.agentesService.backup(id);
  }

  /** Lista tars em AVD_ARTIFACTS_DIR no host do agente. */
  @Get(':id/backups')
  listBackups(@Param('id') id: string) {
    return this.agentesService.listBackups(id);
  }

  /**
   * Baixa o tar. Query `path` opcional (absoluto no servidor);
   * senão lastBackupPath / mais recente do nome.
   */
  @Get(':id/backup')
  async downloadBackup(
    @Param('id') id: string,
    @Query('path') path: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename } = await this.agentesService.openBackupDownload(
      id,
      path,
    );
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(stream);
  }
}
