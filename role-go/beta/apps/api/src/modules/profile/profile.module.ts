import { Module } from '@nestjs/common';
import { MeService } from './application/me.service';
import { MeController } from './http/me.controller';

@Module({ controllers: [MeController], providers: [MeService], exports: [MeService] })
export class ProfileModule {}
