import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { AuthModule } from './auth/auth.module'
import { CatalogController } from './common/catalog.controller'
import { MeModule } from './me/me.module'
import { PasswordReset } from './users/password-reset.entity'
import { User } from './users/user.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const database = config.get<string>('DB_PATH') ?? './data/rolego.sqlite'
        if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true })
        return {
          type: 'better-sqlite3' as const,
          database,
          entities: [User, PasswordReset],
          synchronize: (config.get<string>('DB_SYNC') ?? 'true') === 'true',
        }
      },
    }),
    AuthModule,
    MeModule,
  ],
  controllers: [CatalogController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
