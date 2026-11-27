import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard, EventGuard, OriginGuard } from './common.js';
import { config } from './config.js';
import { DatabaseModule } from './database.js';
import { AuthController } from './auth/auth.controller.js';
import { MfaService } from './auth/mfa.service.js';
import { SecurityController } from './auth/security.controller.js';
import { AccountController } from './features/account.controller.js';
import { AuctionController } from './features/auction.controller.js';
import { ChatController } from './features/chat.controller.js';
import { CommerceController } from './features/commerce.controller.js';
import { EventController, EventListController } from './features/events.controller.js';
import { OrganizationController } from './features/organization.controller.js';
import { ProgramController } from './features/program.controller.js';
import { RealtimeModule, StreamController } from './features/realtime.js';
import { ServicesController } from './features/services.controller.js';

@Module({
  imports: [DatabaseModule, RealtimeModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: config.devTools ? 3000 : 240 }])],
  controllers: [AuthController, SecurityController, AccountController, EventListController, EventController, ProgramController, ChatController,
    AuctionController, CommerceController, ServicesController, OrganizationController, StreamController],
  providers: [MfaService, AuthGuard, EventGuard, { provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: OriginGuard }],
})
export class AppModule {}
