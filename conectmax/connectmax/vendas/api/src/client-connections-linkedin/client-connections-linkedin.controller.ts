import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { ClientConnectionsLinkedinService } from './client-connections-linkedin.service';
import { CreateClientConnectionLinkedinDto } from './create-client-connection-linkedin.dto';
import { MarkAcceptedConnectionsDto } from './mark-accepted-connections.dto';

@Controller('client-connections-linkedin')
@Resource('connections')
export class ClientConnectionsLinkedinController {
  constructor(
    private readonly connectionsService: ClientConnectionsLinkedinService,
  ) {}

  /**
   * Lista conexões (mais recentes primeiro).
   * Query: `page`, `limit`, `agentId`, `status` (0|1|2), `profileUrl`, `clienteLinkedinId`.
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('agentId') agentId?: string,
    @Query('status') status?: string,
    @Query('profileUrl') profileUrl?: string,
    @Query('clienteLinkedinId') clienteLinkedinId?: string,
  ) {
    return this.connectionsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      agentId,
      status: status !== undefined && status !== '' ? Number(status) : undefined,
      profileUrl,
      clienteLinkedinId,
    });
  }

  /**
   * Match por score (nome/cargo/cidade/empresa) contra conexões de qualquer agente.
   * Usado pelo extract antes de abrir o card — não usa Connect/Pending da UI.
   * Query: `name` (obrig.), `title`, `city`, `current`.
   */
  @Get('match')
  matchByScore(
    @Query('name') name?: string,
    @Query('title') title?: string,
    @Query('city') city?: string,
    @Query('current') current?: string,
  ) {
    return this.connectionsService.matchExistingByScore({
      name,
      title,
      city,
      current,
    });
  }

  /**
   * Upsert da conexão agente ↔ cliente_linkedin.
   * Callback do screen-robot após Connect+Skip+Pending (`status: 1`).
   */
  @Post()
  create(@Body() dto: CreateClientConnectionLinkedinDto) {
    return this.connectionsService.upsertOne(dto);
  }

  /**
   * Após listar N conexões recentes no LinkedIn: nomes que batem com
   * convites `status: 1` do agente → `status: 2` (aceito/conectado).
   */
  @Post('mark-accepted')
  markAccepted(@Body() dto: MarkAcceptedConnectionsDto) {
    return this.connectionsService.markAcceptedByRecentList(dto);
  }
}
