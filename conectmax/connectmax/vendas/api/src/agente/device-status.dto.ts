import { IsIn } from 'class-validator';

export class DeviceStatusDto {
  @IsIn(['ativo', 'dormindo'])
  status!: 'ativo' | 'dormindo';
}
