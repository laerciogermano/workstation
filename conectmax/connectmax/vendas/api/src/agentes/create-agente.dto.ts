import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const LI_STATUS = ['ativa', 'restrita', 'banida', 'inativa'] as const;

export class CreateAgenteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nome!: string;

  /** Copia SSH/host de outro agente. */
  @IsOptional()
  @IsUUID()
  copyHostFromAgenteId?: string;

  @ValidateIf((o: CreateAgenteDto) => !o.copyHostFromAgenteId)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  hostNome?: string;

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

  @ValidateIf(
    (o: CreateAgenteDto) =>
      !o.copyHostFromAgenteId &&
      !o.localhost &&
      o.hostKind !== 'gestor',
  )
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ipPublico?: string;

  @IsOptional()
  @IsBoolean()
  localhost?: boolean;

  /** server | gestor | localhost */
  @IsOptional()
  @IsIn(['server', 'gestor', 'localhost'])
  hostKind?: 'server' | 'gestor' | 'localhost';

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
  @IsInt()
  @Min(1)
  @Max(102400)
  diskGb?: number | null;

  @IsOptional()
  @IsBoolean()
  nestedKvm?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  hostStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  image?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  adbPort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fromBackup?: string | null;

  /** Se true (default), sobe o container após create. */
  @IsOptional()
  @IsBoolean()
  start?: boolean;

  /**
   * Se false, só grava o cadastro (host/LI) sem criar container Docker.
   * Útil para gestores cadastrarem conta LinkedIn.
   */
  @IsOptional()
  @IsBoolean()
  provisionDevice?: boolean;

  @IsOptional()
  @IsString()
  notas?: string | null;

  // —— LinkedIn ——

  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkedinNome?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  linkedinUsuario?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  linkedinSenha?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinProfileUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinHeadline?: string | null;

  @IsOptional()
  @IsString()
  linkedinPhotoBase64?: string | null;

  @IsOptional()
  @IsIn(LI_STATUS)
  linkedinStatus?: (typeof LI_STATUS)[number];
}

export class UpdateAgenteDto {
  /** agentId lógico (`provision.name`); único. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  hostNome?: string;

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
  @IsIn(['server', 'gestor', 'localhost'])
  hostKind?: 'server' | 'gestor' | 'localhost';

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
  @IsInt()
  @Min(1)
  @Max(102400)
  diskGb?: number | null;

  @IsOptional()
  @IsBoolean()
  nestedKvm?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  hostStatus?: string;

  @IsOptional()
  @IsString()
  notas?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkedinNome?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  linkedinUsuario?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  linkedinSenha?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinProfileUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinHeadline?: string | null;

  @IsOptional()
  @IsString()
  linkedinPhotoBase64?: string | null;

  @IsOptional()
  @IsIn(LI_STATUS)
  linkedinStatus?: (typeof LI_STATUS)[number];
}
