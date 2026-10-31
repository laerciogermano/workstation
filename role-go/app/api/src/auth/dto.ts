import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { PASSWORD_MIN } from '../common/catalog'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

const pwMsg = `Senha mínima: ${PASSWORD_MIN} caracteres.`

export class RegisterDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(254)
  email: string

  @IsString()
  @MinLength(PASSWORD_MIN, { message: pwMsg })
  @MaxLength(128)
  password: string

  @IsString()
  confirmPassword: string
}

export class LoginDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha.' })
  password: string
}

export class ForgotPasswordDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string

  @IsString()
  @MinLength(PASSWORD_MIN, { message: pwMsg })
  @MaxLength(128)
  password: string

  @IsString()
  confirmPassword: string
}

export class GoogleLoginDto {
  // authorization code do Google Identity Services (popup, redirect "postmessage")
  @IsString()
  @IsNotEmpty()
  code: string
}

export class AppleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string

  // A Apple só manda o nome no primeiro login, pelo front.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string
}
