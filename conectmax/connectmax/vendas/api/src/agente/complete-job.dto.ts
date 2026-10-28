import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteJobDto {
  @IsOptional()
  @IsObject()
  result?: Record<string, unknown>;
}

export class FailJobDto {
  @IsString()
  @MaxLength(2000)
  error!: string;
}
