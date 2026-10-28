import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const STATUS = ['ativa', 'restrita', 'banida', 'inativa'] as const;

export class ContaLinkedinInfracaoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  tipo!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  descricao!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  data?: string | null;

  @IsOptional()
  @IsBoolean()
  resolvida?: boolean;
}

export class CreateContaLinkedinDto {
  @IsUUID()
  agenteId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(320)
  usuario!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(400)
  senha!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  headline?: string | null;

  @IsOptional()
  @IsString()
  photoBase64?: string | null;

  @IsOptional()
  @IsIn(STATUS)
  status?: (typeof STATUS)[number];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ContaLinkedinInfracaoDto)
  infracoes?: ContaLinkedinInfracaoDto[];

  @IsOptional()
  @IsString()
  notas?: string | null;
}

export class UpdateContaLinkedinDto {
  @IsOptional()
  @IsUUID()
  agenteId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(320)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(400)
  senha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  headline?: string | null;

  @IsOptional()
  @IsString()
  photoBase64?: string | null;

  @IsOptional()
  @IsIn(STATUS)
  status?: (typeof STATUS)[number];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ContaLinkedinInfracaoDto)
  infracoes?: ContaLinkedinInfracaoDto[];

  @IsOptional()
  @IsString()
  notas?: string | null;
}

export class AddInfracaoDto extends ContaLinkedinInfracaoDto {}
