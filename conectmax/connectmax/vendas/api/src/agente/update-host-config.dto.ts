import { IsInt, Max, Min } from 'class-validator';

export class UpdateHostConfigDto {
  @IsInt()
  @Min(1)
  @Max(64)
  maxAtivos!: number;
}
