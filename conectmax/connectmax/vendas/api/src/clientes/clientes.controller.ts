import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import {
  CreateClienteDto,
  UpdateClienteDto,
  UpsertClienteLinkedinDto,
} from './create-cliente.dto';
import { ClientesService } from './clientes.service';

@Controller('clientes')
@Resource('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * Lista clientes (mais recentes primeiro), com `linkedin` quando existir.
   * Query: `page`, `limit` (máx. 100), `q`.
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.clientesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Get(':id/linkedin')
  findLinkedin(@Param('id') id: string) {
    return this.clientesService.findLinkedin(id);
  }

  /** Upsert da filha LinkedIn (cria se não existir; merge se existir). */
  @Put(':id/linkedin')
  upsertLinkedin(
    @Param('id') id: string,
    @Body() dto: UpsertClienteLinkedinDto,
  ) {
    return this.clientesService.upsertLinkedin(id, dto);
  }
}
