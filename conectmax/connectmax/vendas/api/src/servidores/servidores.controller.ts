import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import {
  CreateServidorDto,
  UpdateServidorDto,
} from './create-servidor.dto';
import { ServidoresService } from './servidores.service';

@Controller('servidores')
@Resource('servidores')
export class ServidoresController {
  constructor(private readonly servidoresService: ServidoresService) {}

  /**
   * Lista. Query: `page`, `limit` (máx. 200), `q`, `status`.
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.servidoresService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      status,
    });
  }

  @Post()
  create(@Body() dto: CreateServidorDto) {
    return this.servidoresService.create(dto);
  }

  /** Upsert por hostname ou IP (seed / sync). */
  @Post('upsert')
  upsert(@Body() dto: CreateServidorDto) {
    return this.servidoresService.upsertOne(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servidoresService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServidorDto) {
    return this.servidoresService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servidoresService.remove(id);
  }
}
