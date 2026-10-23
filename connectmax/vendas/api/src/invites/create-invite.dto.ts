import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInviteDto {
  @IsString()
  @MaxLength(500)
  profileUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  status?: string;

  @IsOptional()
  @IsISO8601()
  invitedAt?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[] | null;
}
