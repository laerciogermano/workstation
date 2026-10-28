import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HeartbeatDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostInstanceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  workerVersion?: string;
}
