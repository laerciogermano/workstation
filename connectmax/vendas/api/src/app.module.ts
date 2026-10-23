import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './invites/invite.entity';
import { InvitesModule } from './invites/invites.module';
import { Profile } from './profiles/profile.entity';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'connectmax'),
        password: config.get<string>('DB_PASSWORD', 'connectmax'),
        database: config.get<string>('DB_NAME', 'connectmax'),
        entities: [Profile, Invite],
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    ProfilesModule,
    InvitesModule,
  ],
})
export class AppModule {}
