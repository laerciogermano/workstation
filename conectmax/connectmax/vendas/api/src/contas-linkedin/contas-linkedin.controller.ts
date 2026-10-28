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
import {
  AddInfracaoDto,
  CreateContaLinkedinDto,
  UpdateContaLinkedinDto,
} from './create-conta-linkedin.dto';
import { Resource } from '../auth/resource.decorator';
import { ContasLinkedinService } from './contas-linkedin.service';

@Controller('contas-linkedin')
@Resource('contas')
export class ContasLinkedinController {
  constructor(private readonly contasService: ContasLinkedinService) {}

  /**
   * Lista. Query: `page`, `limit` (máx. 200), `q`, `status`, `agenteId`.
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('agenteId') agenteId?: string,
  ) {
    return this.contasService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      status,
      agenteId,
    });
  }

  @Post()
  create(@Body() dto: CreateContaLinkedinDto) {
    return this.contasService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContaLinkedinDto) {
    return this.contasService.update(id, dto);
  }

  /** Acrescenta uma infração; se não resolvida, marca conta como restrita. */
  @Post(':id/infracoes')
  addInfracao(@Param('id') id: string, @Body() dto: AddInfracaoDto) {
    return this.contasService.addInfracao(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contasService.remove(id);
  }
}
