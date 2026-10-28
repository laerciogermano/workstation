import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Resource } from '../auth/resource.decorator';
import { CreateAvdDto } from './create-avd.dto';
import { AvdsService } from './avds.service';

@Controller('avds')
@Resource('avds')
export class AvdsController {
  constructor(private readonly avdsService: AvdsService) {}

  /**
   * Lista. Query: `status` (ativo|dormindo), `servidorId`, `q`,
   * `sync=true` (docker ps → DB), `grouped=true` (ativos/dormindo).
   */
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('servidorId') servidorId?: string,
    @Query('q') q?: string,
    @Query('sync') sync?: string,
    @Query('grouped') grouped?: string,
  ) {
    return this.avdsService.findAll({
      status,
      servidorId,
      q,
      sync: sync === '1' || sync === 'true',
      grouped: grouped === '1' || grouped === 'true',
    });
  }

  /** Descobre containers docker-avd-* nos hosts e upsert. */
  @Post('sync')
  sync(@Query('servidorId') servidorId?: string) {
    return this.avdsService.syncFromHosts(servidorId);
  }

  @Post()
  create(@Body() dto: CreateAvdDto) {
    return this.avdsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('sync') sync?: string) {
    return this.avdsService.findOne(id, {
      sync: sync === '1' || sync === 'true',
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.avdsService.remove(id);
  }

  /** Para o container (dormindo). */
  @Post(':id/sleep')
  sleep(@Param('id') id: string) {
    return this.avdsService.sleep(id);
  }

  /** Sobe o container (ativo). */
  @Post(':id/wake')
  wake(@Param('id') id: string) {
    return this.avdsService.wake(id);
  }

  /**
   * Ping ADB no host do AVD (SSH/local → `adb connect 127.0.0.1:adbPort`).
   * Não sobe/para o container.
   */
  @Post(':id/ping')
  ping(@Param('id') id: string) {
    return this.avdsService.pingAdb(id);
  }

  /** Exporta `/android-home` → tar.gz no servidor. */
  @Post(':id/backup')
  backup(@Param('id') id: string) {
    return this.avdsService.backup(id);
  }

  /** Lista tars em AVD_ARTIFACTS_DIR no host do AVD. */
  @Get(':id/backups')
  listBackups(@Param('id') id: string) {
    return this.avdsService.listBackups(id);
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
    const { stream, filename } = await this.avdsService.openBackupDownload(
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
