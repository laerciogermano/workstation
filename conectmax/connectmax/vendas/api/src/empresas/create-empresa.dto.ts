import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const CNPJ_FMT =
  /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

export class CreateEmpresaDto {
  @IsOptional()
  @IsString()
  @Matches(CNPJ_FMT, { message: 'cnpj deve ser 00.000.000/0000-00' })
  cnpj?: string | null;

  @IsString()
  @MaxLength(400)
  razaoSocial!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  nomeFantasia?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  fontes?: string[];

  @IsOptional()
  @IsNumber()
  pedidosQtd?: number;

  @IsOptional()
  @IsNumber()
  pedidosValor?: number;

  @IsOptional()
  @IsNumber()
  orcamentosQtd?: number;

  @IsOptional()
  @IsNumber()
  orcamentosValor?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  vendedores?: string[];
}

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  @Matches(CNPJ_FMT, { message: 'cnpj deve ser 00.000.000/0000-00' })
  cnpj?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  razaoSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  nomeFantasia?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  fontes?: string[];

  @IsOptional()
  @IsNumber()
  pedidosQtd?: number;

  @IsOptional()
  @IsNumber()
  pedidosValor?: number;

  @IsOptional()
  @IsNumber()
  orcamentosQtd?: number;

  @IsOptional()
  @IsNumber()
  orcamentosValor?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  vendedores?: string[];
}

export class ImportEmpresasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmpresaDto)
  empresas!: CreateEmpresaDto[];
}
