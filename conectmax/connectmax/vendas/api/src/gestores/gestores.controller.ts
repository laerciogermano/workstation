import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { SetGestorAgentesDto } from './create-gestor.dto';
import { GestoresService } from './gestores.service';

@Controller('gestores')
@Resource('gestores')
export class GestoresController {
  constructor(private readonly gestoresService: GestoresService) {}

  /**
   * Lista usuários com role=gestor (+ agentes).
   * Query: `page`, `limit`≤200, `q`, `agentId`, `active`.
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('agentId') agentId?: string,
    @Query('active') active?: string,
  ) {
    let activeBool: boolean | undefined;
    if (active === '1' || active === 'true') activeBool = true;
    if (active === '0' || active === 'false') activeBool = false;
    return this.gestoresService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      agentId,
      active: activeBool,
    });
  }

  /** Opções de agente (AVDs) para o formulário — sem exigir `avds:read`. */
  @Get('agentes')
  listAgentes() {
    return this.gestoresService.listAgenteOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gestoresService.findOne(id);
  }

  /** Substitui a lista de agentes do gestor. */
  @Put(':id/agentes')
  setAgentes(@Param('id') id: string, @Body() dto: SetGestorAgentesDto) {
    return this.gestoresService.setAgentes(id, dto);
  }
}
