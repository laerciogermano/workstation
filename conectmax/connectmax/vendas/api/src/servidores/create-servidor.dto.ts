import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateServidorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provedor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  produto?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostname?: string | null;

  /** Obrigatório se não for localhost (default 127.0.0.1). */
  @ValidateIf((o: CreateServidorDto) => !o.localhost)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ipPublico?: string;

  @IsOptional()
  @IsBoolean()
  localhost?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  ipPrivado?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sshUser?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  sshPort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  sshPassword?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1024)
  ramGb?: number | null;

  @IsOptional()
  @IsBoolean()
  nestedKvm?: boolean;

  @IsOptional()
  @IsString()
  notas?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;
}

export class UpdateServidorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provedor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  produto?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostname?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ipPublico?: string;

  @IsOptional()
  @IsBoolean()
  localhost?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  ipPrivado?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sshUser?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  sshPort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  sshPassword?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1024)
  ramGb?: number | null;

  @IsOptional()
  @IsBoolean()
  nestedKvm?: boolean;

  @IsOptional()
  @IsString()
  notas?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;
}
