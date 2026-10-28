import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CLIENT_LINKEDIN_MESSAGE_DIRECTIONS,
  ClientLinkedinMessageDirection,
} from './client-linkedin-message-direction';

export class ClientLinkedinMessageItemDto {
  @IsIn(CLIENT_LINKEDIN_MESSAGE_DIRECTIONS as unknown as string[])
  direction!: ClientLinkedinMessageDirection;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sender?: string | null;

  /** Alias de time_label (UI LinkedIn). */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  time?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeLabel?: string | null;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string | null;
}

export class UpsertClientLinkedinMessagesDto {
  @IsOptional()
  @IsUUID()
  clienteLinkedinId?: string;

  @ValidateIf((o) => !o.clienteLinkedinId)
  @IsString()
  @MaxLength(500)
  profileUrl?: string;

  /** Se o cliente_linkedin não existir, usa como `clientes.nome`. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  peerName?: string | null;

  @IsString()
  @MaxLength(120)
  agentId!: string;

  /** Lote (leitura do chat). */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientLinkedinMessageItemDto)
  messages?: ClientLinkedinMessageItemDto[];

  /** Item único (envio). */
  @ValidateIf((o) => !o.messages?.length)
  @IsIn(CLIENT_LINKEDIN_MESSAGE_DIRECTIONS as unknown as string[])
  direction?: ClientLinkedinMessageDirection;

  @ValidateIf((o) => !o.messages?.length)
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sender?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  time?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeLabel?: string | null;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string | null;
}
