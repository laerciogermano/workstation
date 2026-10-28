import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Auto-cadastro magro do worker (device/presença). LinkedIn fica pro painel. */
export class EnrollDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  serial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  containerName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  adbPort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  image?: string;

  @IsOptional()
  @IsIn(['server', 'gestor', 'localhost'])
  hostKind?: 'server' | 'gestor' | 'localhost';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hostNome?: string;

  @IsOptional()
  @IsBoolean()
  localhost?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostname?: string;

  @IsOptional()
  @IsIn(['ativo', 'dormindo'])
  status?: 'ativo' | 'dormindo';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostInstanceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  workerVersion?: string;

  /**
   * Create: default true (emite key scoped uma vez).
   * Update: só emite se `true` explícito.
   */
  @IsOptional()
  @IsBoolean()
  issueApiKey?: boolean;
}
