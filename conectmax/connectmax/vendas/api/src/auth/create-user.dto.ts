import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from './roles';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MaxLength(200)
  nome!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
