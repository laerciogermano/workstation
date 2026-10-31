import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import {
  AppleLoginDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto'
import { clearSessionCookie, setSessionCookie } from './session'
import { SocialService } from './social.service'

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly social: SocialService,
    private readonly users: UsersService,
  ) {}

  private async startSession(res: Response, user: User) {
    setSessionCookie(res, await this.auth.sign(user))
    return { user: this.users.toPublic(user) }
  }

  @Get('providers')
  providers() {
    return this.social.providers()
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.register(dto.email, dto.password, dto.confirmPassword)
    return this.startSession(res, user)
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.startSession(res, await this.auth.login(dto.email, dto.password))
  }

  @Post('google')
  @HttpCode(200)
  async google(@Body() dto: GoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    const id = await this.social.verifyGoogleCode(dto.code)
    return this.startSession(res, await this.auth.socialLogin('google', id))
  }

  @Post('apple')
  @HttpCode(200)
  async apple(@Body() dto: AppleLoginDto, @Res({ passthrough: true }) res: Response) {
    const id = await this.social.verifyAppleIdToken(dto.idToken)
    return this.startSession(res, await this.auth.socialLogin('apple', id, dto.name))
  }

  @Post('forgot-password')
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email)
  }

  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.resetPassword(dto.token, dto.password, dto.confirmPassword)
    return this.startSession(res, user)
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    clearSessionCookie(res)
  }
}
