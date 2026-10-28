import {
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ClientConnectionLinkedinStatus } from './client-connection-linkedin-status';

const STATUS_VALUES = [
  ClientConnectionLinkedinStatus.NOT_SENT,
  ClientConnectionLinkedinStatus.PENDING,
  ClientConnectionLinkedinStatus.CONNECTED,
  ClientConnectionLinkedinStatus.DISCARDED,
] as const;

export class CreateClientConnectionLinkedinDto {
  /** FK direta; se omitido, resolve via `profileUrl`. */
  @IsOptional()
  @IsUUID()
  clienteLinkedinId?: string;

  /** URL canônica `linkedin.com/in/…` → busca ou cria `cliente` + `cliente_linkedin`. */
  @ValidateIf((o) => !o.clienteLinkedinId)
  @IsString()
  @MaxLength(500)
  profileUrl?: string;

  /** Nome ao auto-criar cliente (opcional; senão deriva do slug da URL). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  peerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsString()
  @MaxLength(120)
  agentId!: string;

  @IsOptional()
  @IsIn(STATUS_VALUES as unknown as number[])
  status?: ClientConnectionLinkedinStatus;

  @IsOptional()
  @IsISO8601()
  invitedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  connectedAt?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[] | null;

  /** Motivo ao `status: 3` (descartado). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  discardReason?: string | null;
}
