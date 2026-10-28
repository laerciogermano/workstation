import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAvdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nome!: string;

  @IsUUID()
  servidorId!: string;

  /** Imagem base. Default: API 30 google_apis (mesmo do agent-d Contabo). */
  @IsOptional()
  @IsString()
  @MaxLength(400)
  image?: string;

  /** Porta ADB host (1–65535). Default: hash do nome (5655–5754). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  adbPort?: number;

  /**
   * Path do tar de `/android-home` no servidor
   * (ex.: `/root/avd-artifacts/agent-d-android-home-….tar.gz`).
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fromBackup?: string | null;

  /** Se true (default), sobe o container após create. */
  @IsOptional()
  @IsBoolean()
  start?: boolean;

  @IsOptional()
  @IsString()
  notas?: string | null;
}
