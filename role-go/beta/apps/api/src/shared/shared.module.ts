import { Global, Module } from '@nestjs/common';
import { DenylistService } from './auth/denylist.service';
import { TokenService } from './auth/token.service';
import { EmailPort, SmtpEmail } from './email/email.port';
import { env } from './env';
import { FakeGeocoder, GeocodingPort, LiveGeocoder } from './geo/geocoding';
import { JobQueue, PgBossQueue } from './jobs/job-queue';
import { Clock, SystemClock } from './kernel/clock';
import { MediaService } from './media/media.service';
import { LocalDiskStorage, StoragePort } from './media/storage';

@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    PgBossQueue,
    { provide: JobQueue, useExisting: PgBossQueue },
    { provide: EmailPort, useClass: SmtpEmail },
    { provide: StoragePort, useClass: LocalDiskStorage },
    { provide: GeocodingPort, useClass: env().GEOCODER === 'fake' ? FakeGeocoder : LiveGeocoder },
    MediaService,
    TokenService,
    DenylistService,
  ],
  exports: [Clock, JobQueue, PgBossQueue, EmailPort, StoragePort, GeocodingPort, MediaService, TokenService, DenylistService],
})
export class SharedModule {}
