import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'
import { EVENT_TYPES, RADIUS_MAX_KM, RADIUS_MIN_KM } from '../common/catalog'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome completo.' })
  @MaxLength(120)
  name?: string

  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(254)
  email?: string
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Escolha pelo menos um tipo de evento.' })
  @ArrayMaxSize(EVENT_TYPES.length)
  @IsIn(EVENT_TYPES as unknown as string[], { each: true, message: 'Tipo de evento inválido.' })
  eventTypes?: string[]

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Informe a cidade.' })
  @MaxLength(80)
  city?: string

  @IsOptional()
  @IsBoolean()
  locationGranted?: boolean

  // lat/lng só vêm junto com a permissão concedida; null limpa
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsLatitude()
  latitude?: number | null

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsLongitude()
  longitude?: number | null

  @IsOptional()
  @IsInt()
  @Min(RADIUS_MIN_KM, { message: `Raio mínimo: ${RADIUS_MIN_KM} km.` })
  @Max(RADIUS_MAX_KM, { message: `Raio máximo: ${RADIUS_MAX_KM} km.` })
  radiusKm?: number
}
