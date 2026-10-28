import { Controller, Get, Query } from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { ClientConnectionsLinkedinService } from '../client-connections-linkedin/client-connections-linkedin.service';
import { ClientLinkedinMessagesService } from '../client-linkedin-messages/client-linkedin-messages.service';

/**
 * Listagem da base LinkedIn (conexões + mensagens).
 *
 * GET /linkedin-base              → ambos
 * GET /linkedin-base/connections  → só conexões
 * GET /linkedin-base/messages     → só mensagens
 */
@Controller('linkedin-base')
@Resource('connections')
export class LinkedinBaseController {
  constructor(
    private readonly connections: ClientConnectionsLinkedinService,
    private readonly messages: ClientLinkedinMessagesService,
  ) {}

  @Get()
  async summary(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('agentId') agentId?: string,
    @Query('profileUrl') profileUrl?: string,
    @Query('status') status?: string,
    @Query('direction') direction?: string,
  ) {
    const pageN = page ? Number(page) : 1;
    const limitN = limit ? Number(limit) : 50;
    const [connections, messages] = await Promise.all([
      this.connections.findAll({
        page: pageN,
        limit: limitN,
        agentId,
        profileUrl,
        status:
          status !== undefined && status !== '' ? Number(status) : undefined,
      }),
      this.messages.findAll({
        page: pageN,
        limit: limitN,
        agentId,
        profileUrl,
        direction,
      }),
    ]);
    return {
      ok: true,
      connections,
      messages,
    };
  }

  @Get('connections')
  listConnections(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('agentId') agentId?: string,
    @Query('profileUrl') profileUrl?: string,
    @Query('clienteLinkedinId') clienteLinkedinId?: string,
    @Query('status') status?: string,
  ) {
    return this.connections.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      agentId,
      profileUrl,
      clienteLinkedinId,
      status:
        status !== undefined && status !== '' ? Number(status) : undefined,
    });
  }

  @Get('messages')
  listMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('agentId') agentId?: string,
    @Query('profileUrl') profileUrl?: string,
    @Query('clienteLinkedinId') clienteLinkedinId?: string,
    @Query('direction') direction?: string,
  ) {
    return this.messages.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      agentId,
      profileUrl,
      clienteLinkedinId,
      direction,
    });
  }
}
