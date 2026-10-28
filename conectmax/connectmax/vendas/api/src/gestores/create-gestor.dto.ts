import {
  ArrayUnique,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

/** Substitui a lista de agentes do gestor (usuário com role=gestor). */
export class SetGestorAgentesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  agentIds!: string[];
}
