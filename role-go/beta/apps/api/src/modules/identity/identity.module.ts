import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile';
import { AuthService } from './application/auth.service';
import { AuthController, JwksController } from './http/auth.controller';

@Module({ imports: [ProfileModule], controllers: [AuthController, JwksController], providers: [AuthService], exports: [AuthService] })
export class IdentityModule {}
