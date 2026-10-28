import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPrincipal } from './auth-user';
import { LoginDto } from './login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  async me(@Req() req: { user: AuthPrincipal }) {
    if (req.user.kind === 'service') {
      return {
        id: 'service',
        email: null,
        nome: 'Service',
        role: 'service',
        permissions: ['*'],
      };
    }
    const user = await this.auth.findById(req.user.sub);
    if (!user) return null;
    return this.auth.toPublic(user);
  }
}
