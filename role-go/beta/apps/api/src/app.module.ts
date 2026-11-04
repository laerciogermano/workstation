import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { CatalogModule } from './modules/catalog';
import { DiscoveryModule } from './modules/discovery';
import { EngagementModule } from './modules/engagement';
import { EventsModule } from './modules/events';
import { IdentityModule } from './modules/identity';
import { ModerationModule } from './modules/moderation';
import { NotificationsModule } from './modules/notifications';
import { OrganizerModule } from './modules/organizer';
import { ProfileModule } from './modules/profile';
import { ReviewsModule } from './modules/reviews';
import { SharingModule } from './modules/sharing';
import { AuthGuard } from './shared/auth/auth.guard';
import { DbModule } from './shared/db/db.module';
import { ProblemFilter } from './shared/errors/problem.filter';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }], skipIf: () => process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT !== 'on' }),
    DbModule,
    SharedModule,
    IdentityModule,
    ProfileModule,
    CatalogModule,
    OrganizerModule,
    EventsModule,
    DiscoveryModule,
    EngagementModule,
    ReviewsModule,
    SharingModule,
    ModerationModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class AppModule {}
