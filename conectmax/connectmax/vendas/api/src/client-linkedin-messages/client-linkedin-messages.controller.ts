import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { ClientLinkedinMessagesService } from './client-linkedin-messages.service';
import { UpsertClientLinkedinMessagesDto } from './create-client-linkedin-message.dto';

@Controller('client-linkedin-messages')
@Resource('messages')
export class ClientLinkedinMessagesController {
  constructor(private readonly messagesService: ClientLinkedinMessagesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('agentId') agentId?: string,
    @Query('profileUrl') profileUrl?: string,
    @Query('clienteLinkedinId') clienteLinkedinId?: string,
    @Query('direction') direction?: string,
  ) {
    return this.messagesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      agentId,
      profileUrl,
      clienteLinkedinId,
      direction,
    });
  }

  /** Upsert de 1 mensagem (envio) ou lote (leitura do chat). */
  @Post()
  upsert(@Body() dto: UpsertClientLinkedinMessagesDto) {
    return this.messagesService.upsertBatch(dto);
  }
}
