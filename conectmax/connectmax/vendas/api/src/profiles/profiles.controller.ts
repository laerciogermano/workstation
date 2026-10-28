import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { CreateProfileDto, CreateProfilesBatchDto } from './create-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@Resource('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Lista perfis ativos (mais recentes primeiro). Soft-deleted ficam de fora.
   * Query: `page`, `limit`, `q`, `agentId` (só reservados status=0 desse agente).
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.profilesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      agentId,
    });
  }

  /**
   * Soft-delete de todos os candidatos ativos (`deleted_at`).
   * Não REMOVE linhas do Postgres.
   */
  @Delete()
  softDeleteAll() {
    return this.profilesService.softDeleteAllActive();
  }

  /**
   * Resolve ou cria stub de perfil a partir de URL LinkedIn (sem disparar extract).
   * Ex.: GET /profiles/ensure?url=https://www.linkedin.com/in/…
   */
  @Get('ensure')
  ensureByUrl(
    @Query('url') url?: string,
    @Query('profileUrl') profileUrl?: string,
  ) {
    return this.profilesService.ensureForLinkedInUrl(url || profileUrl || '');
  }

  /** Um perfil por id (404 se soft-deleted). */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  /**
   * Soft-delete de um candidato (`deleted_at`).
   * Não REMOVE a linha do Postgres; some de GET /profiles e GET /profiles/:id.
   */
  @Delete(':id')
  softDeleteOne(@Param('id') id: string) {
    return this.profilesService.softDeleteOne(id);
  }

  /** Um perfil (callback onProfile do extract). */
  @Post()
  create(@Body() dto: CreateProfileDto) {
    return this.profilesService.upsertOne(dto);
  }

  /** Lote (ex.: profiles.json completo). */
  @Post('batch')
  createBatch(@Body() body: CreateProfilesBatchDto) {
    return this.profilesService.upsertMany(body.profiles);
  }
}
