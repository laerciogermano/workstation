import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class MarkAcceptedConnectionItemDto {
  /** Nome como aparece na lista Connections do LinkedIn (OCR). */
  @IsString()
  @MaxLength(300)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  connectedOn?: string | null;
}

/**
 * Callback do robot após listar N conexões recentes:
 * cruza nomes com convites `status: 1` do agente e promove a `2` (conectado).
 */
export class MarkAcceptedConnectionsDto {
  @IsString()
  @MaxLength(120)
  agentId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarkAcceptedConnectionItemDto)
  connections!: MarkAcceptedConnectionItemDto[];
}
