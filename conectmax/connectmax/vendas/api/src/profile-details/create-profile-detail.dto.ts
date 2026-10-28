import {
  IsBoolean,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProfileDetailDto {
  /** = `cliente_linkedin.id` (fachada). Opcional se `profileUrl` vier. */
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string | null;

  @IsOptional()
  @IsString()
  company?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  headline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  connections?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mutualConnections?: string | null;

  @IsOptional()
  @IsBoolean()
  canConnect?: boolean | null;

  @IsOptional()
  @IsBoolean()
  canMessage?: boolean | null;

  /** connect | pending | connected */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  inviteStatus?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  connectionDegree?: string | null;

  @IsOptional()
  @IsString()
  about?: string | null;

  @IsOptional()
  @IsString()
  experience?: string | null;

  @IsOptional()
  @IsString()
  education?: string | null;

  @IsOptional()
  @IsString()
  skills?: string | null;

  @IsOptional()
  @IsString()
  photoBase64?: string | null;

  @IsOptional()
  @IsString()
  coverBase64?: string | null;

  @IsOptional()
  @IsString()
  cardBase64?: string | null;

  @IsOptional()
  @IsObject()
  rawOcr?: object | null;

  @IsOptional()
  @IsISO8601()
  extractedAt?: string | null;
}
