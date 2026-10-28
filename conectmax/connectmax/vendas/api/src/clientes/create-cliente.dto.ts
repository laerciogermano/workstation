import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpsertClienteLinkedinDto {
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
  company?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  connections?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mutualConnections?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  connectionDegree?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  inviteStatus?: string | null;

  @IsOptional()
  @IsBoolean()
  canConnect?: boolean | null;

  @IsOptional()
  @IsBoolean()
  canMessage?: boolean | null;

  @IsOptional()
  @IsString()
  about?: string | null;

  @IsOptional()
  @IsString()
  experience?: string | null;

  @IsOptional()
  @IsString()
  education?: string | null;

  @IsOptional()
  @IsString()
  skills?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  searchQuery?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  past?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  round?: number | null;

  @IsOptional()
  @IsString()
  photoBase64?: string | null;

  @IsOptional()
  @IsString()
  coverBase64?: string | null;

  @IsOptional()
  @IsString()
  cardBase64?: string | null;

  @IsOptional()
  @IsObject()
  rawOcr?: object | null;

  @IsOptional()
  @IsISO8601()
  extractedAt?: string | null;
}

export class CreateClienteDto {
  @IsString()
  @MaxLength(200)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  empresa?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cargo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cidade?: string | null;

  @IsOptional()
  @IsString()
  notas?: string | null;

  /** Se enviado, cria/atualiza a filha `cliente_linkedin` no mesmo request. */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertClienteLinkedinDto)
  linkedin?: UpsertClienteLinkedinDto;
}

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  empresa?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cargo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cidade?: string | null;

  @IsOptional()
  @IsString()
  notas?: string | null;
}
