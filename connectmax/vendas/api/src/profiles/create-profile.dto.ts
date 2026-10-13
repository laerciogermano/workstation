import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  level?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  connection?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mutualConnections?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  current?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  past?: string | null;

  @IsOptional()
  @IsISO8601()
  extractedAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  round?: number | null;
}

export class CreateProfilesBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProfileDto)
  profiles!: CreateProfileDto[];
}
