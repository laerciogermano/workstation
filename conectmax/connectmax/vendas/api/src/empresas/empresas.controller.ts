import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import {
  CreateEmpresaDto,
  ImportEmpresasDto,
  UpdateEmpresaDto,
} from './create-empresa.dto';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
@Resource('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  /**
   * Lista empresas. Query: `page`, `limit` (máx. 200), `q`, `comCnpj` (`true`|`false`).
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('comCnpj') comCnpj?: string,
  ) {
    let flag: boolean | undefined;
    if (comCnpj === 'true' || comCnpj === '1') flag = true;
    if (comCnpj === 'false' || comCnpj === '0') flag = false;
    return this.empresasService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      comCnpj: flag,
    });
  }

  /** Upsert em lote (seed a partir de `empresas.json`). */
  @Post('import')
  importMany(@Body() dto: ImportEmpresasDto) {
    return this.empresasService.importMany(dto.empresas);
  }

  @Post()
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresasService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(id, dto);
  }
}
